from phi.agent import Agent
from phi.model.google import Gemini
from phi.tools.googlesearch import GoogleSearch
from phi.tools.postgres import PostgresTools
import os
from dotenv import load_dotenv

load_dotenv(r"..\.env")

GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')
SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_DB = os.getenv('SUPABASE_DB')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')

postgres_tools = PostgresTools(
    host=SUPABASE_HOST,
    port=int(SUPABASE_PORT),
    db_name=SUPABASE_DB,
    user=SUPABASE_USER, 
    password=SUPABASE_PASSWORD
)

gemini_model = Gemini(
    id="gemini-2.0-flash",
    api_key=GEMINI_API_KEY
)

search_agent = Agent(
    tools=[GoogleSearch()],
    model=gemini_model,
    instructions=[
        "Give top Indian performings stocks as json with stock-price pairs",
        "Always include sources when sharing information"
    ],
    show_tool_calls=True,
    debug_mode=True,
)

search_agent.print_response("Top performing NSE Stocks today.")

#Black Litterman Model

from pypfopt.risk_models import CovarianceShrinkage
from pypfopt.efficient_frontier import EfficientFrontier
from pypfopt.black_litterman import BlackLittermanModel
from pypfopt.expected_returns import mean_historical_return
import yfinance as yf

# Step 1: Define User Inputs (AI agent collects this)
savings = float(input("Enter your total savings for investment: "))  # Example: $10,000
tickers = ["AAPL", "TSLA", "AMZN", "MSFT", "GOOGL"]  # Stocks considered
risk_tolerance = "medium"  # AI determines based on user preference

# Step 2: Fetch Historical Market Data
data = yf.download(tickers, start="2018-01-01", end="202-01-01")["Adj Close"]
returns = data.pct_change().dropna()
mu = mean_historical_return(data)
S = CovarianceShrinkage(data).ledoit_wolf()

# Step 3: Define Market Views (AI agent processes user sentiment)
# Example: User believes AAPL will outperform TSLA, and GOOGL will slightly underperform the market.
views = {
    "AAPL": 0.02,  # 2% expected excess return over the market
    "TSLA": -0.01,  # TSLA expected to underperform by 1%
    "GOOGL": -0.005  # GOOGL slightly underperforming
}

# Step 4: Create Black-Litterman Model
bl = BlackLittermanModel(S, pi=mu, absolute_views=views)
bl_return = bl.bl_returns()
bl_cov = bl.bl_cov()

# Step 5: Optimize Portfolio using Efficient Frontier
ef = EfficientFrontier(bl_return, bl_cov)
if risk_tolerance == "low":
    ef.min_volatility()
elif risk_tolerance == "medium":
    ef.max_quadratic_utility()
else:
    ef.max_sharpe()

weights = ef.clean_weights()
allocation = {ticker: round(weights[ticker] * savings, 2) for ticker in tickers}

# Step 6: Display Results
print("\n**Optimized Black-Litterman Portfolio Allocation**")
for asset, amount in allocation.items():
    print(f"{asset}: ${amount}")

print("\nExpected Portfolio Performance:")
ef.portfolio_performance(verbose=True)
