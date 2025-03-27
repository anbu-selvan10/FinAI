import json
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from phi.workflow import Workflow, RunResponse
import yfinance as yf
from phi.agent import Agent
from phi.model.google import Gemini
from phi.model.azure import AzureOpenAIChat
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt.efficient_frontier import EfficientFrontier
from pypfopt.risk_models import CovarianceShrinkage
from pypfopt.expected_returns import mean_historical_return
from phi.tools import Toolkit
from phi.utils.log import logger
import os
from dotenv import load_dotenv
from phi.tools.yfinance import YFinanceTools
from risk_analyst import risk_analysis_team
from savings import savings_agent

load_dotenv(r"..\.env")

GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')
AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")

azure_model = AzureOpenAIChat(
    id=AZURE_DEPLOYMENT,
    api_key=AZURE_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT,
)

gemini_model = Gemini(
    id="gemini-2.0-flash",
    api_key=GEMINI_API_KEY
)

class BlackLittermanPortfolioOptimizer(Toolkit):
    def __init__(self):
        super().__init__(name="black_litterman_optimizer")
        self.register(self.optimize_black_litterman_portfolio)

    def optimize_black_litterman_portfolio(
        self, tickers: List[str], savings: float, risk_tolerance: str
    ) -> Dict[str, float]:
        """
        Optimizes a portfolio using the Black-Litterman Model with AI-generated views.

        Args:
            tickers (List[str]): List of stock tickers (e.g., ["AAPL", "TSLA", "GOOGL"]).
            savings (float): User's total investment amount.
            risk_tolerance (str): Risk level - "low", "medium", or "high".

        Returns:
            Dict[str, float]: Optimized portfolio allocation in JSON format. Converted into string for pydantic.
        """
        logger.info(f"Fetching stock data for: {tickers}")

        try:
            data = yf.download(tickers, start="2018-01-01", end="2024-01-01")["Close"]

            #Historical Mean Method
            monthly_returns = data.resample('M').ffill().pct_change().dropna()
            expected_returns = monthly_returns.mean().to_dict()

            #Calculate Risk Model
            mu = mean_historical_return(data)
            S = CovarianceShrinkage(data).ledoit_wolf()

            #Apply Black-Litterman Model with AI-generated views
            bl = BlackLittermanModel(S, pi=mu, absolute_views=expected_returns)
            bl_return = bl.bl_returns()
            bl_cov = bl.bl_cov()

            # Step 5: Optimize Portfolio Allocation
            ef = EfficientFrontier(bl_return, bl_cov)

            if risk_tolerance == "Low Risk":
                ef.min_volatility()
            elif risk_tolerance == "Medium Risk" or risk_tolerance == "Medium-High Risk":
                ef.max_quadratic_utility()
            else:
                ef.max_sharpe()

            weights = ef.clean_weights()
            allocation = {ticker: round(weights[ticker] * savings, 2) for ticker in tickers}

            result = {"allocation": allocation, "expected_returns": expected_returns}

            logger.info(f"Optimized Portfolio Allocation: {result}")
            return str(result)

        except Exception as e:
            logger.warning(f"Error in Black-Litterman Optimization: {e}")
            return {"error": str(e)}

portfolio_agent = Agent(
    name="Portfolio Analyst",
    model=azure_model,
    team=[risk_analysis_team, savings_agent],
    tools=[
        YFinanceTools(stock_price=True, analyst_recommendations=True, stock_fundamentals=True),
        BlackLittermanPortfolioOptimizer()
    ],
    show_tool_calls=True,
    instructions=[
        "Fetch stock data using YFinance.",
        "Calculate expected monthly returns using historical data.",
        "Get the savings using savings_agent and combined risk level or final risk using risk_analysis_team and pass as savings and risk_tolerance",
        "Use these returns as market views in the Black-Litterman model.",
        "Optimize portfolio allocation based on user's savings and risk tolerance.",
        '''Strictly return results in the below format
        First a json output - 
        {'allocation': {'stock_symbol': allocation, ...}, 'expected_returns': {'stock_symbol': return, ...} wrapped in json
        Second a detailed analysis for the reason of allocation point by point.
        '''
    ]
)

class InvestmentData(BaseModel):
    stock_query: str = Field(..., description="The stock search query.")
    savings_results: dict = Field(..., description="Results from the search agent.")
    risk_results: dict = Field(..., description="Results from the stock agent.")

class PortfolioAdvisorWorkflow(Workflow):
    """
    This workflow integrates:
      - search_agent: to get news on the stock,
      - stock_agent: to get recommendations and fundamentals and
      - finai_agent: to advise on whether the user can invest based on the above data.
    """
    savings: Agent = savings_agent
    risk: Agent = risk_analysis_team
    portfolio_advisor: Agent = portfolio_agent

    def run(self, stock_query: str) -> Optional[RunResponse]:
        logger.info(f"Starting Portfolio Optimization Workflow for: {stock_query}")

        logger.info("Step 1: Calculating Savings")
        savings_response: RunResponse = self.savings.run(stock_query)
        savings_results = {"content": savings_response.content}
        logger.info(f"Result: \n{savings_results}\n")

        logger.info("Step 2: Calculating Risk Tolerance")
        risk_response: RunResponse = self.risk.run(stock_query)
        risk_results = {"content": risk_response.content}
        logger.info(f"Result: \n{risk_results}\n")

        combined_input = InvestmentData(
            stock_query=stock_query,
            savings_results=savings_results,
            risk_results=risk_results,
        )
        advisor_input_str = json.dumps(combined_input.model_dump(), indent=4)
        logger.info("Step 3: Getting final portfolio advice")

        advisor_response = self.portfolio_advisor.run(advisor_input_str)
        return advisor_response

portfolio_advisor_workflow = PortfolioAdvisorWorkflow()