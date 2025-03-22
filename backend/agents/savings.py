import json
from phi.agent import Agent
from phi.model.google import Gemini
from phi.model.azure import AzureOpenAIChat
import os
from dotenv import load_dotenv
from decimal import Decimal
import datetime
from sqlalchemy import create_engine, text
from phi.utils.log import logger

load_dotenv(r"..\.env")

AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")

azure_model = AzureOpenAIChat(
    id=AZURE_DEPLOYMENT,
    api_key=AZURE_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT,
)

GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')

gemini_model = Gemini(
    id="gemini-2.0-flash",
    api_key=GEMINI_API_KEY
)

SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_DB = os.getenv('SUPABASE_DB')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')

DATABASE_URL = f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}"

def get_savings(username : str, db_url : str=DATABASE_URL):
    today = datetime.date.today()
    prev_month = today.month - 1 if today.month > 1 else 12
    prev_year = today.year if today.month > 1 else today.year - 1
    engine = create_engine(db_url)
    
    query1 = text(f"""
        SELECT 
            category, 
            COALESCE(budget_amt_categorized, 0) AS budget_amt
        FROM budget where username = :username
        AND month = TO_CHAR(TO_DATE({prev_month}::TEXT, 'MM'), 'FMMonth')
        AND year = :prev_year
    """)
    
    query2 = text("""
        SELECT 
            category, 
            COALESCE(SUM(expense_amt_categorized), 0) AS expense_amt
        FROM expenses
        WHERE EXTRACT(MONTH FROM date) = :prev_month
            AND EXTRACT(YEAR FROM date) = :prev_year
            AND username = :username
        GROUP BY category;
    """)

    with engine.connect() as conn:
        result1 = conn.execute(query1, {"prev_month": prev_month, "prev_year": prev_year, "username": username})
        budget_data = result1.fetchall()
        result2 = conn.execute(query2, {"prev_month": prev_month, "prev_year": prev_year, "username": username})
        expenses_data = result2.fetchall()

    total_budget = sum(amount for _, amount in budget_data)
    total_expenses = sum(float(amount) if isinstance(amount, Decimal) else amount for _, amount in expenses_data)
    savings = total_budget - total_expenses

    def convert_data(data):
        dict_data = dict()
        
        for category, val in data:
            dict_data[category] = float(val)
            
        return dict_data

    result = {
        "budget data": convert_data(budget_data),
        "expenses data": convert_data(expenses_data),
        "total_budget": total_budget,
        "total_expenses": total_expenses,
        "savings": savings
    }


    logger.info(f"Result: \n{result}\n")

    return json.dumps(result)

savings_agent = Agent(
    tools=[get_savings],
    model=gemini_model,
    instructions=[
        "Act as a NER to identify the username in the query",
        "Calculate the savings of the particular user by using get_savings function by passing username"
    ] ,
    show_tool_calls=True,
    markdown=True
)