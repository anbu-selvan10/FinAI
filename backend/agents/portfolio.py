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
import datetime
from sqlalchemy import create_engine, text
from decimal import Decimal

load_dotenv(r"..\.env")

SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_DB = os.getenv('SUPABASE_DB')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')

DATABASE_URL = f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}"

def get_savings(username, db_url=DATABASE_URL):
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

    return {
        "budget data": budget_data,
        "expenses data": expenses_data,
        "total_budget": total_budget,
        "total_expenses": total_expenses,
        "savings": savings
    }

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