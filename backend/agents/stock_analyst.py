from phi.agent import Agent
from phi.model.azure import AzureOpenAIChat
from phi.tools.yfinance import YFinanceTools
from phi.tools.duckduckgo import DuckDuckGo
from phi.tools.postgres import PostgresTools
from dotenv import load_dotenv
import phi
import os
import json
from typing import Optional
from pydantic import BaseModel, Field
from phi.workflow import Workflow, RunResponse
from phi.utils.log import logger

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

#As of now user is hardcoded
user = "Anbu@253"
personalized_agent = Agent(
    name="Personal Agent",
    model=azure_model,
    tools=[postgres_tools],
    instructions=[
        f"Retrieve the username - {user}'s saved amount for each of the previous months.",
        "This can be done by summing budget amount and summing expense amount regardless of categories and subtracting.",
        "Provide small and concise response",
    ],
    markdown=True
)

finai_agent = Agent(
    team=[search_agent, stock_agent, personalized_agent],
    model=azure_model,
    instructions=[
        "Use the search agent to find company-related news and the financial agent to retrieve stock market data.",
        "You should give advise on investment based on the savings of the user."
        "Ensure the data is in concise markdown format for the user."
    ],
    show_tool_calls=True,
    markdown=True
)

class InvestmentData(BaseModel):
    stock_query: str = Field(..., description="The stock search query.")
    search_results: dict = Field(..., description="Results from the search agent.")
    stock_recommendations: dict = Field(..., description="Results from the stock agent.")
    last_month_savings: dict = Field(..., description="Savings computed by the personalized agent.")

class StockInvestmentAdvisorWorkflow(Workflow):
    """
    This workflow integrates:
      - search_agent: to get news on the stock,
      - stock_agent: to get recommendations and fundamentals,
      - personalized_agent: to compute last month's savings, and
      - finai_agent: to advise on whether the user can invest based on the above data.
    """
    searcher: Agent = search_agent
    stock_analyzer: Agent = stock_agent
    personal_calculator: Agent = personalized_agent
    advisor: Agent = finai_agent

    def run(self, stock_query: str) -> Optional[RunResponse]:
        logger.info(f"Starting Stock Investment Advisor Workflow for: {stock_query}")

        logger.info("Step 1: Searching the web for stock-related news")
        search_response: RunResponse = self.searcher.run(stock_query)
        search_results = {"content": search_response.content}

        logger.info("Step 2: Retrieving stock recommendations")
        stock_response: RunResponse = self.stock_analyzer.run(stock_query)
        stock_recommendations = {"content": stock_response.content}

        logger.info("Step 3: Calculating last month savings")
        personal_response: RunResponse = self.personal_calculator.run("")
        last_month_savings = {"content": personal_response.content}

        combined_input = InvestmentData(
            stock_query=stock_query,
            search_results=search_results,
            stock_recommendations=stock_recommendations,
            last_month_savings=last_month_savings,
        )
        advisor_input_str = json.dumps(combined_input.model_dump(), indent=4)
        logger.info("Step 4: Getting final investment advice from fin_ai agent")

        advisor_response = self.advisor.run(advisor_input_str)
        return advisor_response

advisor_workflow = StockInvestmentAdvisorWorkflow()
# app = Playground(agents=[stock_agent, search_agent]).get_app(use_async=False)
# if __name__ == "__main__":
#     serve_playground_app("stock_analyst:app", reload=True)