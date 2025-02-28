from phi.agent import Agent
import yfinance as yf
from phi.model.azure import AzureOpenAIChat
from phi.tools.yfinance import YFinanceTools
from phi.tools.duckduckgo import DuckDuckGo
from phi.tools.postgres import PostgresTools
from dotenv import load_dotenv
import phi
import os

load_dotenv(r"..\.env")

SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_DB = os.getenv('SUPABASE_DB')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')
PHI_KEY = os.getenv("PHI_KEY")
AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")

phi.api = PHI_KEY

azure_model = AzureOpenAIChat(
    id=AZURE_DEPLOYMENT,
    api_key=AZURE_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT,
)

postgres_tools = PostgresTools(
    host=SUPABASE_HOST,
    port=int(SUPABASE_PORT),
    db_name=SUPABASE_DB,
    user=SUPABASE_USER, 
    password=SUPABASE_PASSWORD
)

search_agent = Agent(
    name="Search Agent",
    role="Search the web for Indian financial news",
    model=azure_model,
    tools=[DuckDuckGo()], 
    instructions=["Always search using site:finance.yahoo.com.","Always include sources when sharing information"],
    show_tool_calls=True,
    markdown=True
)

stock_agent = Agent(
    name="Indian Stock Analyst",
    model=azure_model,
    tools=[YFinanceTools(stock_price=True, analyst_recommendations=True, stock_fundamentals=True)],
    show_tool_calls=True,
    description="An investment analyst researching Indian stock prices, analyst recommendations, and stock fundamentals.",
    instructions=["Provide stock data in a concise manner to show to the user"],
    markdown=True
)

personalized_agent = Agent(
    name="Personal Agent",
    model=azure_model,
    tools=[postgres_tools],
    instructions=[
        "Retrieve the user's saved amount for each of the previous months.",
        "This can be done by summing budget amount and summing expense amount regardless of categories and subtracting.",
        "Provide small and concise response",
    ],
    markdown=True
)

finai_agent = Agent(
    team=[search_agent, stock_agent],
    model=azure_model,
    instructions=[
        "Use the search agent to find company-related news and the financial agent to retrieve stock market data.",
        "Ensure the data is in concise markdown format for the user."
    ],
    show_tool_calls=True,
    markdown=True
)
# app = Playground(agents=[stock_agent, search_agent]).get_app(use_async=False)
# if __name__ == "__main__":
#     serve_playground_app("stock_analyst:app", reload=True)