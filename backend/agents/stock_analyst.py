from phi.agent import Agent
from phi.model.azure import AzureOpenAIChat
from phi.tools.yfinance import YFinanceTools
from phi.tools.duckduckgo import DuckDuckGo
from dotenv import load_dotenv
import phi
import os
import json
from typing import Optional
from pydantic import BaseModel, Field
from phi.workflow import Workflow, RunResponse
from phi.utils.log import logger
from pymongo import MongoClient
import time
from dotenv import load_dotenv
import os

load_dotenv(r"..\.env")

MONGODB_URI=os.getenv("MONGODB_URI")
DB_NAME = "FinAI"
COLLECTION_NAME = "stock"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

load_dotenv(r"..\.env")

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

finai_agent = Agent(
    team=[search_agent, stock_agent],
    model=azure_model,
    instructions = [
    "Use the search agent to find company-related news and the financial agent to retrieve stock market data.",
    "Provide investment advice based on historical stock data and analyst recommendations.",
    "Ensure the data is presented in concise markdown format for the user. If the data includes periods, present it as bullet points rather than tables."
    ],
    show_tool_calls=True,
    markdown=True
)

MAX_ATTEMPTS: int = 3

class InvestmentData(BaseModel):
    stock_query: str = Field(..., description="The stock search query.")
    search_results: dict = Field(..., description="Results from the search agent.")
    stock_recommendations: dict = Field(..., description="Results from the stock agent.")

class StockInvestmentAdvisorWorkflow(Workflow):
    """
    This workflow integrates:
      - search_agent: to get news on the stock,
      - stock_agent: to get recommendations and fundamentals and
      - finai_agent: to advise on whether the user can invest based on the above data.
    """
    searcher: Agent = search_agent
    stock_analyzer: Agent = stock_agent
    advisor: Agent = finai_agent

    def run(self, stock_query: str) -> Optional[RunResponse]:
        logger.info(f"Starting Stock Investment Advisor Workflow for: {stock_query}")

        logger.info("Step 1: Searching the web for stock-related news")
        for attempt in range(MAX_ATTEMPTS):
            try:
                search_response: RunResponse = self.searcher.run(stock_query)
                if search_response and search_response.content:    
                    search_results = {"content": search_response.content}
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{MAX_ATTEMPTS} failed: {str(e)}")
                continue
        
        logger.info("Step 2: Retrieving stock recommendations")
        for attempt in range(MAX_ATTEMPTS):
            try:
                stock_response: RunResponse = self.stock_analyzer.run(stock_query)
                if stock_response and stock_response.content:    
                    stock_recommendations = {"content": stock_response.content}
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{MAX_ATTEMPTS} failed: {str(e)}")
                continue

        combined_input = InvestmentData(
            stock_query=stock_query,
            search_results=search_results,
            stock_recommendations=stock_recommendations,
        )

        advisor_input_str = json.dumps(combined_input.model_dump(), indent=4)

        logger.info("Step 3: Getting final investment advice from fin_ai agent")

        for attempt in range(MAX_ATTEMPTS):
            try:
                advisor_response = self.advisor.run(advisor_input_str)
                if advisor_response and advisor_response.content:    
                    return advisor_response
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{MAX_ATTEMPTS} failed: {str(e)}")
                continue

    def save_to_db(self, topic: str, response: str, user_id:str, session_id:str):
        current_timestamp = int(time.time())

        session_data = collection.find_one({"session_id": session_id})

        if session_data:
            collection.update_one(
                {"session_id": session_id},
                {
                    "$push": {"memory.runs": {"input": topic, "response": response}},
                    "$set": {"updated_at": current_timestamp},
                    "$unset": { 
                        "workflow_id": "",
                        "user_data": "",
                        "session_data": "",
                        "workflow_data": "",
                    }
                }
            )
        else:
            # Create new session
            new_session = {
                "session_id": session_id,
                "user_id": user_id,
                "memory": {"runs": [{"input": topic, "response": response}]},
                "created_at": current_timestamp,
                "updated_at": current_timestamp,  # Initialize updated_at as well
            }
            collection.insert_one(new_session)

advisor_workflow = StockInvestmentAdvisorWorkflow()
# app = Playground(agents=[stock_agent, search_agent]).get_app(use_async=False)
# if __name__ == "__main__":
#     serve_playground_app("stock_analyst:app", reload=True)