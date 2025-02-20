import os
import smtplib
import pymysql
import pymongo
from email.message import EmailMessage
from email.utils import formataddr
from dotenv import load_dotenv
from pathlib import Path
from celery import shared_task
from celery_app import celery_app
import calendar
from datetime import datetime

# Load environment variables from .env file
current_dir = Path(__file__).resolve().parent if "__file__" in locals() else Path.cwd()
envars = current_dir / ".env"
load_dotenv(r"..\.env")

# SMTP Configuration
PORT = 587
EMAIL_SERVER = "smtp.gmail.com"

# Read credentials from .env
sender_email = os.getenv("EMAIL_ID")
password_email = os.getenv("EMAIL_PASS")
db_password = os.getenv("MYSQL_PASSWORD")
mongo_uri = os.getenv("MONGODB_URI")

# Database Configurations
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": db_password,
    "database": "finai"
}

# MongoDB Connection
mongo_client = pymongo.MongoClient(mongo_uri)
mongo_db = mongo_client["FinAI"]
users_collection = mongo_db["users"]

def get_user_email(username):
    """
    Fetch user's email from MongoDB based on username.
    Returns None if user not found.
    """
    try:
        user = users_collection.find_one({"userName": username})
        return user.get("email") if user else None
    except Exception as e:
        print(f"MongoDB Error: {e}")
        return None

def get_month_name(month_number):
    """Converts numeric month to month name"""
    try:
        return calendar.month_name[int(month_number)]
    except (ValueError, IndexError):
        return None

def get_month_number(month_name):
    """Converts month name to numeric month"""
    try:
        return list(calendar.month_name).index(month_name)
    except ValueError:
        return None

def fetch_expense_budget_comparison():
    """
    Fetches and compares monthly expenses against budgets.
    Returns records where expenses exceed or equal budget.
    Account for month being stored as month name (January, February, etc.)
    """
    try:
        connection = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
        with connection.cursor() as cursor:
            query = """
            SELECT 
                e.username,
                e.category,
                DATE_FORMAT(e.date, '%m') as expense_month_num,
                DATE_FORMAT(e.date, '%M') as expense_month_name,
                YEAR(e.date) as year,
                b.budget_amt_categorized,
                b.month as budget_month,
                SUM(e.expense_amt_categorized) as total_expenses
            FROM expenses e
            JOIN budget b 
                ON e.username = b.username 
                AND e.category = b.category 
                AND DATE_FORMAT(e.date, '%M') = b.month
                AND YEAR(e.date) = b.year
            GROUP BY 
                e.username, 
                e.category, 
                DATE_FORMAT(e.date, '%m'),
                DATE_FORMAT(e.date, '%M'),
                YEAR(e.date),
                b.budget_amt_categorized,
                b.month
            HAVING total_expenses >= budget_amt_categorized;
            """
            cursor.execute(query)
            results = cursor.fetchall()
        connection.close()
        return results
    except pymysql.MySQLError as err:
        print(f"Database Error: {err}")
        return []

@celery_app.task
def send_email_task(subject, receiver_email, username, category, month, year, budget_amt, total_expenses):
    """Celery task to send an email alert."""
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = formataddr(("FinAI Alert", sender_email))
        msg["To"] = receiver_email

        msg.set_content(f"""
        Hi {username},

        This is a notification that your expenses for {category} in {month}/{year} have exceeded your budget!
        
        Budget: {budget_amt} RS
        Current Total Expenses: {total_expenses} RS
        Amount Exceeded: {total_expenses - budget_amt} RS

        Please review your expenses and adjust accordingly.

        Best regards,
        Finance Team - Anbu & Vivek
        """)

        msg.add_alternative(f"""
        <html>
          <body>
            <p>Hi {username},</p>
            <p>This is a notification that your expenses for <strong>{category}</strong> in <strong>{month}/{year}</strong> have exceeded your budget!</p>
            <p>
                <ul>
                    <li>Budget: <strong>{budget_amt} RS</strong></li>
                    <li>Current Total Expenses: <strong>{total_expenses} RS</strong></li>
                    <li>Amount Exceeded: <strong>{total_expenses - budget_amt} RS</strong></li>
                </ul>
            </p>
            <p>Please review your expenses and adjust accordingly.</p>
            <p>Best regards,</p>
            <p>Finance Team - Anbu & Vivek</p>
          </body>
        </html>
        """, subtype="html")

        with smtplib.SMTP(EMAIL_SERVER, PORT) as server:
            server.starttls()
            server.login(sender_email, password_email)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        return f"✅ Email sent to {receiver_email} for exceeding budget in {category}"
    except Exception as e:
        return f"Failed to send email to {receiver_email}: {str(e)}"

@celery_app.task
def check_and_send_emails():
    """
    Periodically checks expenses against budgets and sends emails for exceeded budgets.
    Fetches user email from MongoDB based on username.
    """
    try:
        exceeded_budgets = fetch_expense_budget_comparison()
        results = []
        
        if not exceeded_budgets:
            print("All spending limits are safe!")
            return "No budgets exceeded"

        for record in exceeded_budgets:
            username = record["username"]
            receiver_email = get_user_email(username)
            
            if not receiver_email:
                print(f"Warning: No email found for user {username}")
                continue
                
            result = send_email_task.delay(
                subject="Budget Alert: Spending Limit Exceeded",
                receiver_email=receiver_email,
                username=username,
                category=record["category"],
                month=record["budget_month"],  # Using the month name from budget table
                year=record["year"],
                budget_amt=record["budget_amt_categorized"],
                total_expenses=record["total_expenses"]
            )
            results.append(f"Scheduled email to {receiver_email} for {record['category']}")
        
        return results
    except Exception as e:
        return f"Error in check_and_send_emails: {str(e)}"

# Clean up MongoDB connection when the application exits
import atexit
atexit.register(lambda: mongo_client.close())




