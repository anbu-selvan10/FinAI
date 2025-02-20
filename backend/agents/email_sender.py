import os
import smtplib
import pymongo
import calendar
from email.message import EmailMessage
from email.utils import formataddr
from dotenv import load_dotenv
from pathlib import Path
from celery import shared_task
from celery_app import celery_app
from datetime import datetime
from supabase import create_client, Client

# Load environment variables
current_dir = Path(__file__).resolve().parent if "__file__" in locals() else Path.cwd()
envars = current_dir / ".env"
load_dotenv(r"..\.env")

# SMTP Configuration
PORT = 587
EMAIL_SERVER = "smtp.gmail.com"

# Read credentials from .env
sender_email = os.getenv("EMAIL_ID")
password_email = os.getenv("EMAIL_PASS")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_API_KEY")
mongo_uri = os.getenv("MONGODB_URI")

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

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
    """
    try:
        # Fetch expenses and budget data from Supabase
        expense_data = supabase.from_("expenses").select("*").execute().data
        budget_data = supabase.from_("budget").select("*").execute().data

        exceeded_budgets = []

        if not expense_data or not budget_data:
            return exceeded_budgets

        # Group and compare expenses with budget
        expense_summary = {}
        for expense in expense_data:
            key = (expense["username"], expense["category"], expense["date"][:7])  # Group by user, category, month
            expense_summary[key] = expense_summary.get(key, 0) + expense["expense_amt_categorized"]

        for budget in budget_data:
            budget_key = (budget["username"], budget["category"], f"{budget['year']}-{get_month_number(budget['month']):02d}")
            budget_amount = budget["budget_amt_categorized"]
            total_expenses = expense_summary.get(budget_key, 0)

            if total_expenses >= budget_amount:
                exceeded_budgets.append({
                    "username": budget["username"],
                    "category": budget["category"],
                    "month": budget["month"],
                    "year": budget["year"],
                    "budget_amt": budget_amount,
                    "total_expenses": total_expenses
                })

        return exceeded_budgets
    except Exception as e:
        print(f"Supabase Query Error: {e}")
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
                month=record["month"],
                year=record["year"],
                budget_amt=record["budget_amt"],
                total_expenses=record["total_expenses"]
            )
            results.append(f"Scheduled email to {receiver_email} for {record['category']}")

        return results
    except Exception as e:
        return f"Error in check_and_send_emails: {str(e)}"

# Clean up MongoDB connection when the application exits
import atexit
atexit.register(lambda: mongo_client.close())





