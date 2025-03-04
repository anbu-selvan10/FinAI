from typing import List, Dict
import yfinance as yf
from phi.agent import Agent
from phi.model.google import Gemini
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt.efficient_frontier import EfficientFrontier
from pypfopt.risk_models import CovarianceShrinkage
from pypfopt.expected_returns import mean_historical_return
from phi.tools import Toolkit
from phi.utils.log import logger
import os
from dotenv import load_dotenv
from phi.tools.yfinance import YFinanceTools

load_dotenv(r"..\.env")

GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')

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

            if risk_tolerance == "low":
                ef.min_volatility()
            elif risk_tolerance == "medium":
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

stock_agent = Agent(
    name="Portfolio Analyst",
    model=gemini_model,
    tools=[
        YFinanceTools(stock_price=True, analyst_recommendations=True, stock_fundamentals=True),
        BlackLittermanPortfolioOptimizer()
    ],
    show_tool_calls=True,
    instructions=[
        "Fetch stock data using YFinance.",
        "Calculate expected monthly returns using historical data.",
        "Use these returns as market views in the Black-Litterman model.",
        "Optimize portfolio allocation based on user's savings and risk tolerance.",
        "Return results in JSON format."
    ]
)

print(stock_agent.run("Portfolio optimization for INFY.NS, RELIANCE.NS, TATAMOTORS.NS with risk tolerance medium with savings 10000 rupees").content)