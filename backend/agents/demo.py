from phi.agent import Agent
from phi.model.google import Gemini
from phi.tools.yfinance import YFinanceTools
import os
from dotenv import load_dotenv
import phi
import time
import random
import yfinance as yf
import numpy as np
from tenacity import retry, stop_after_attempt, wait_exponential
from datetime import datetime
import json
import re

load_dotenv(r"..\.env")

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

gemini_model = Gemini(
    id="gemini-2.0-flash",
    api_key=GEMINI_API_KEY
)

# Retry decorator to handle rate limits
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=30))
def run_agent_with_retry(agent, message):
    try:
        return agent.run(message)
    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower() or "exhausted" in str(e).lower():
            print("Rate limit reached, retrying...")
            time.sleep(random.uniform(1, 5))
            raise e
        else:
            print(f"Error: {e}")
            raise e

def get_stock_history_with_dividends(stock_symbol, period="5mo"):
    """
    Fetch historical stock data, ensuring 'Adj Close' is present.
    If missing, copy 'Close' column as 'Adj Close'.
    """
    ticker = yf.Ticker(stock_symbol)
    stock_data = ticker.history(period=period, auto_adjust=False)  # Ensure raw data
    if 'Adj Close' not in stock_data.columns:
        print("Warning: 'Adj Close' column not found, using 'Close' instead.")
        stock_data['Adj Close'] = stock_data['Close']
    return stock_data

def calculate_technical_indicators(stock_symbol, period="5mo"):
    """
    Fetch historical stock prices and compute:
    - 5-month volatility (std dev of daily returns)
    - Average True Range (ATR)
    - Average trading volume
    """
    data = get_stock_history_with_dividends(stock_symbol, period)
    if data.empty:
        raise ValueError(f"No data found for {stock_symbol}. Check symbol or market hours.")
    
    # Calculate daily returns from the 'Adj Close' column
    data['Returns'] = data['Adj Close'].pct_change()
    volatility = np.std(data['Returns'].dropna())
    
    # Calculate True Range components and ATR
    data['High-Low'] = data['High'] - data['Low']
    data['High-PrevClose'] = abs(data['High'] - data['Adj Close'].shift(1))
    data['Low-PrevClose'] = abs(data['Low'] - data['Adj Close'].shift(1))
    data['TR'] = data[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1)
    atr = data['TR'].rolling(window=14).mean().iloc[-1]
    
    # Get last closing price to normalize ATR
    last_close = data['Adj Close'].iloc[-1]
    
    avg_volume = data['Volume'].mean()
    
    return round(volatility, 4), round(atr, 4), last_close, int(avg_volume)

def calculate_news_impact(news_text):
    """
    Estimate news impact on a scale of 0-10 based on content
    0-2: Low impact (neutral/slightly positive)
    3-5: Moderate impact (mixed)
    6-8: High impact (concerning)
    9-10: Extreme impact (very negative)
    """
    news_agent = Agent(
        name="News Impact Assessor",
        role="Assess financial news impact",
        model=gemini_model,
        instructions=[
            "Analyze financial news to determine potential market impact.",
            "Rate on a scale of 0-10 (0: positive, 10: extremely negative).",
            "Respond with ONLY a number between 0-10."
        ],
        show_tool_calls=False,
        markdown=False,
    )
    
    impact_score = run_agent_with_retry(
        news_agent,
        f"""
        Based on the following news summary:
        "{news_text}"
        
        Rate its potential negative impact on the stock price on a scale of 0-10:
        - 0-2: Low impact (neutral/slightly positive news)
        - 3-5: Moderate impact (mixed news)
        - 6-8: High impact (concerning news)
        - 9-10: Extreme impact (very negative news)
        
        Respond with ONLY a number between 0-10.
        """
    )
    
    try:
        score = float(re.search(r'\d+(?:\.\d+)?', str(impact_score)).group())
        return min(max(score, 0), 10)  
    except (ValueError, AttributeError):
        return 5.0

def auto_volume_threshold(avg_volume):
    if avg_volume > 50_000_000_000:   # Large Cap (High Volume Stocks like Tesla, Apple)
        return 1_000_000_000
    elif avg_volume > 5_000_000_000:  # Mid Cap 
        return 500_000_000
    elif avg_volume > 500_000_000:    # Small Cap
        return 100_000_000
    else:                             # Ultra Low Liquidity
        return max(1_000_000, avg_volume * 0.1)  

def normalize_metrics(volatility, atr, last_close, avg_volume, news_impact):
    volume_threshold = auto_volume_threshold(avg_volume)
    
    norm_volatility = volatility * 100 

    norm_atr = (atr / last_close) * 100 

    if avg_volume < 1_000_000: 
        # For very small volumes, use a linear scaling from 0-80%
        norm_volume = min((avg_volume / volume_threshold) * 80, 80)
    else:
        raw_norm_volume = min(np.log10(avg_volume / volume_threshold) * 10, 100)
        norm_volume = max(raw_norm_volume, 0) 

    norm_news = news_impact * 10

    details = {
        "volume_threshold": volume_threshold,
        "raw_volume": avg_volume,
        "volume_ratio": avg_volume / volume_threshold,
        "norm_volume": norm_volume,
    }

    return norm_volatility, norm_atr, norm_volume, norm_news, details

def calculate_weighted_risk(metrics, weights):
    """
    Calculate weighted risk percentage based on normalized metrics and their weights.
    """
    return sum(metric * weight for metric, weight in zip(metrics, weights))

def categorize_risk_level(risk_percentage):
    if risk_percentage < 5:
        return "Low Risk ✅"
    elif risk_percentage < 10:
        return "Moderate Risk 🟡"
    elif risk_percentage < 15:
        return "Moderate-High Risk 🟠"
    elif risk_percentage < 20:
        return "High Risk 🔴"
    else:
        return "Extreme Risk 🚨"


risk_analysis_team = Agent(
    name="Risk Analysis Team",
    role="Synthesize data into concise risk assessment",
    model=gemini_model,
    instructions=[
        "Identify 2-4 key risk factors in order of significance based on yFinance data collected for the last 5 months.",
        "Provide confidence level (low, medium, high).",
        "Format output as a clear risk report with EXACTLY 15 lines or fewer.",
        "Include risk factors and their significance in the analysis.",
        "Do not include any detailed data, news, or tool traces.",
    ],
    show_tool_calls=False,
    markdown=False,
)

def analyze_stock_risk(stock_symbol):
    """
    Performs a streamlined risk analysis using simplified volume normalization.
    """
    print(f"\nAnalyzing risk for {stock_symbol}...")
    
    weights = {
        "volatility": 0.35, 
        "atr": 0.34,         
        "volume": 0.23,      
        "news": 0.08        
    }

    try:
        # Calculate technical indicators manually from 5-month data
        volatility_value, atr_value, last_close, avg_volume_value = calculate_technical_indicators(stock_symbol)
        
        # Print the last 5-month period data in JSON format for verification
        last_month_data = get_stock_history_with_dividends(stock_symbol, period="5mo")
        print("\nLast 5 Month Period Data Snippet (JSON):")
        print(json.dumps(last_month_data.tail(5).to_dict(orient="records"), indent=2))
        
        # Data collection agent for news headlines
        news_agent = Agent(
            name="News Collection Agent",
            role="Fetch major recent news affecting the stock",
            model=gemini_model,
            tools=[
                YFinanceTools(company_news=True)
            ],
            show_tool_calls=False,
            markdown=False,
        )
        news_result = run_agent_with_retry(
            news_agent,
            f"Fetch the **top 1-2 major news headlines** from the past month for {stock_symbol}. "
            "Summarize the key points in **two lines only**. "
            "DO NOT include raw article details, just key takeaways."
        )
        
        news_text = str(news_result).strip()
        news_impact = calculate_news_impact(news_text)
        
        # Fixed normalize_metrics call with correct parameters
        norm_volatility, norm_atr, norm_volume, norm_news, details = normalize_metrics(
            volatility_value,  # volatility
            atr_value,         # atr
            last_close,        # last_close
            avg_volume_value,  # avg_volume
            news_impact        # news_impact
        )
        
        # Calculate weighted risk
        normalized_metrics = [norm_volatility, norm_atr, norm_volume, norm_news]
        weight_values = list(weights.values())
        risk_percentage = calculate_weighted_risk(normalized_metrics, weight_values)
        risk_percentage = round(risk_percentage, 2)
        
        # Categorize risk level
        risk_level = categorize_risk_level(risk_percentage)
        
        data_summary = f"""
            - **5-Month Volatility:** {volatility_value} (normalized: {norm_volatility:.2f}%, weight: {weights['volatility']*100}%)
            - **Average True Range (ATR):** {atr_value} (normalized: {norm_atr:.2f}%, weight: {weights['atr']*100}%)
            - **Average Trading Volume:** {avg_volume_value} (normalized: {norm_volume:.2f}%, weight: {weights['volume']*100}%)
            - **Recent News:** {news_text} (impact score: {news_impact}/10, normalized: {norm_news:.2f}%, weight: {weights['news']*100}%)
            - **Final Risk Calculation:** {risk_percentage}% - {risk_level}
        """
        print(f"\n[DATA COLLECTION]\n{data_summary}\n")
        
        volatility_contribution = norm_volatility * weights["volatility"]
        atr_contribution = norm_atr * weights["atr"]
        volume_contribution = norm_volume * weights["volume"]
        news_contribution = norm_news * weights["news"]
        
        # Feed the structured summary into the risk analysis agent for factor analysis
        final_assessment = run_agent_with_retry(
            risk_analysis_team, 
            f"""
                Based on the following summarized data for {stock_symbol}:
                {data_summary}

                Create a risk report for the stock with:
                1. 3-5 key risk factors in order of significance.
                2. Confidence level for each key factor (low, medium, high).

                The risk calculation has already been done with the following contributions:
                - Volatility contributes {volatility_contribution:.2f}% to risk (weight: {weights['volatility']*100}%)
                - ATR contributes {atr_contribution:.2f}% to risk (weight: {weights['atr']*100}%) 
                - Volume contributes {volume_contribution:.2f}% to risk (weight: {weights['volume']*100}%)
                - News contributes {news_contribution:.2f}% to risk (weight: {weights['news']*100}%)
                - Total risk: {risk_percentage}% - {risk_level}

                FORMAT REQUIREMENTS:
                - Output must be 25 lines or fewer.
                - Use clear headings.
                - Focus on explaining key risk factors.
                - Include recent news headlines as a factor if significant.
                - Do NOT recalculate the risk percentage or override the calculation - use the exact value provided.
                            """
        )
        
        output = final_assessment.content if hasattr(final_assessment, 'content') else str(final_assessment)
        
        calculation_details = f"""
            RISK CALCULATION DETAILS:
            - Volatility: {norm_volatility:.2f}% × {weights['volatility']} = {volatility_contribution:.2f}%
            - ATR Impact: {norm_atr:.2f}% × {weights['atr']} = {atr_contribution:.2f}%
            - Volume Impact: {norm_volume:.2f}% × {weights['volume']} = {volume_contribution:.2f}%
            - News Impact: {norm_news:.2f}% × {weights['news']} = {news_contribution:.2f}%

            TOTAL MONTHLY RISK: {risk_percentage}% - {risk_level}
        """
        
        # Add calculation details to output
        final_output = output.strip() + "\n\n" + calculation_details.strip()
        
        current_date = datetime.today().strftime("%B %d, %Y")
        print("\n" + "=" * 50)
        print(f"RISK ASSESSMENT FOR {stock_symbol}")
        print(f"Date: {current_date}")
        print("=" * 50)
        print(final_output.strip())
        print("=" * 50)

    except Exception as e:
        print(f"Error in risk analysis: {e}")
        import traceback
        traceback.print_exc()
        print("Please try again later.")

if __name__ == "__main__":
    stock_symbol = input("Enter stock symbol to analyze (e.g., AAPL): ")
    analyze_stock_risk(stock_symbol)
