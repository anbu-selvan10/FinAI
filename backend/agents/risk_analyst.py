from phi.tools import Toolkit
from phi.tools.duckduckgo import DuckDuckGo
from phi.tools.yfinance import YFinanceTools
from phi.agent import Agent
from phi.utils.log import logger
from typing import Dict, Any, List
import yfinance as yf
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from phi.model.google import Gemini
from dotenv import load_dotenv
import os
import re
import json
from phi.model.azure import AzureOpenAIChat

load_dotenv(r"..\.env")

AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')

gemini_model = Gemini(
    id="gemini-2.0-flash",
    api_key=GEMINI_API_KEY
)


azure_model = AzureOpenAIChat(
    id=AZURE_DEPLOYMENT,
    api_key=AZURE_KEY,
    azure_endpoint=AZURE_ENDPOINT,
    azure_deployment=AZURE_DEPLOYMENT,
)

news_agent = Agent(
        name="News Impact Assessor",
        role="Assess financial news impact",
        model=azure_model,
        tools=[DuckDuckGo(), YFinanceTools()],
        instructions=[
            "Analyze last month and recent financial news of the stock using the tool to determine potential market impact.",
            "Rate on a scale of 0-10 (0: positive, 10: extremely negative).",
            '''
            Please analyze the sentiment of the following text and rate it on a scale from 0 to 10, where:

            0 = Extremely Positive: Overwhelmingly positive, with no significant drawbacks. Highly optimistic, celebratory.
            1 = Very Positive: Strongly positive, with only minor, negligible downsides.
            2 = Positive: Positive news overall, with minor issues or challenges acknowledged.
            3 = Slightly Positive: Positive tone, but with more noticeable issues or a cautious outlook.
            4 = Neutral to Slightly Positive: Neither clearly positive nor negative, but leaning slightly toward positive.
            5 = Neutral: Balanced, neither positive nor negative. The tone is factual and objective.
            6 = Slightly Negative: Negative tone with some positive aspects or potential for recovery.
            7 = Negative: Clearly negative with some potential for improvement or recovery.
            8 = Very Negative: Strongly negative, with little to no hope or positive aspects.
            9 = Extremely Negative: Overwhelmingly negative, with no positives. The situation is dire or highly problematic.
            10 = Extremely Negative: Highly severe, possibly catastrophic news, with no redeeming qualities.
            ''',
            '''Strictly format the output as a python dictionary in the below format:
                {
                    "rating": <rating here>,
                    "reason": <reason here>
                }
            ''',
            "The output should be only json."
        ],
        show_tool_calls=False,
        markdown=False,
    )

def extract_rating(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)

    if match:
        json_data = json.loads(match.group())
        return float(json_data["rating"])
    else:
        return 5.0
    
class StockRiskTools(Toolkit):
    def __init__(self):
        super().__init__(name="stock_risk_tools")
        self.register(self.calculate_technical_indicators)
        self.register(self.normalize_metrics)
        self.register(self.calculate_weighted_risk)
        self.register(self.categorize_risk_level)
        self.register(self.analyze_stock_risk)

    def calculate_technical_indicators(self, stock_symbol: str, period: str = "5mo") -> Dict[str, Any]:
        """
        Fetch historical stock prices and compute technical indicators:
        - 5-month volatility (std dev of daily returns)
        - Average True Range (ATR)
        - Average trading volume
        
        Args:
            stock_symbol (str): The stock ticker symbol
            period (str): Time period for data collection (default: "5mo")
            
        Returns:
            Dict[str, Any]: Dictionary containing calculated technical indicators
        """
        logger.info(f"Calculating technical indicators for {stock_symbol}")
        try:            
            # Get stock data
            ticker = yf.Ticker(stock_symbol)
            data = ticker.history(period=period, auto_adjust=False)
                
            data['Returns'] = data['Close'].pct_change()
            volatility = np.std(data['Returns'].dropna())
            
            # Calculate True Range components and ATR
            data['High-Low'] = data['High'] - data['Low']
            data['High-PrevClose'] = abs(data['High'] - data['Close'].shift(1))
            data['Low-PrevClose'] = abs(data['Low'] - data['Close'].shift(1))
            data['TR'] = data[['High-Low', 'High-PrevClose', 'Low-PrevClose']].max(axis=1)
            atr = data['TR'].rolling(window=14).mean().iloc[-1]
            
            # Get last closing price to normalize ATR
            last_close = data['Close'].iloc[-1]
            
            avg_volume = data['Volume'].mean()
            
            # res =  {
            #     "volatility": round(volatility, 4),
            #     "atr": round(atr, 4),
            #     "last_close": last_close,
            #     "avg_volume": int(avg_volume)
            # }

            res = [round(volatility, 4), round(atr, 4), last_close, int(avg_volume)]

            return res
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
    
    def auto_volume_threshold(self, avg_volume: float) -> float:
        """
        Determine appropriate volume threshold based on average volume.
        
        Args:
            avg_volume (float): Average trading volume
            
        Returns:
            float: Calculated volume threshold
        """
        if avg_volume > 50_000_000_000:  
            return 1_000_000_000
        elif avg_volume > 5_000_000_000:   
            return 500_000_000
        elif avg_volume > 500_000_000:   
            return 100_000_000
        else:                             
            return max(1_000_000, avg_volume * 0.1)
    
    def normalize_metrics(self, volatility: float, atr: float, last_close: float, 
                          avg_volume: float, news_impact: float) -> Dict[str, Any]:
        """
        Normalize risk metrics to comparable scales.
        
        Args:
            volatility (float): Volatility value
            atr (float): Average True Range value
            last_close (float): Last closing price
            avg_volume (float): Average trading volume
            news_impact (float): News impact score (0-10)
            
        Returns:
            Dict[str, Any]: Dictionary containing normalized metrics
        """
        logger.info("Normalizing risk metrics")
        try:
            volume_threshold = self.auto_volume_threshold(avg_volume)
            
            norm_volatility = volatility * 100 
            norm_atr = (atr / last_close) * 100 
            
            if avg_volume < 1_000_000: 
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
            
            # res = {
            #     "norm_volatility": norm_volatility,
            #     "norm_atr": norm_atr,
            #     "norm_volume": norm_volume,
            #     "norm_news": norm_news,
            #     "details": details
            # }

            res = [norm_volatility, norm_atr, norm_volume, norm_news, details]

            return res
        except Exception as e:
            logger.error(f"Error normalizing metrics: {e}")
    
    def calculate_weighted_risk(self, metrics: List[float], weights: List[float]) -> Dict[str, Any]:
        """
        Calculate weighted risk percentage based on normalized metrics and their weights.
        
        Args:
            metrics (List[float]): List of normalized metric values
            weights (List[float]): List of weights for each metric
            
        Returns:
            Dict[str, Any]: Dictionary containing weighted risk calculation
        """
        logger.info("Calculating weighted risk")
        try:
            if len(metrics) != len(weights):
                return {
                    "status": "error",
                    "message": f"Metrics and weights must have same length. Got {len(metrics)} metrics and {len(weights)} weights."
                }
            
            weighted_risk = sum(metric * weight for metric, weight in zip(metrics, weights))
            
            return round(weighted_risk, 2)
        
        except Exception as e:
            logger.error(f"Error calculating weighted risk: {e}")
    
    def categorize_risk_level(self, risk_percentage: float) -> Dict[str, Any]:
        """
        Categorize risk level based on calculated risk percentage.
        
        Args:
            risk_percentage (float): Calculated risk percentage
            
        Returns:
            Dict[str, Any]: Dictionary containing risk level category
        """
        logger.info(f"Categorizing risk level for {risk_percentage}%")
        try:
            if risk_percentage < 5:
                risk_level = "Low Risk"
            elif risk_percentage < 10:
                risk_level = "Moderate Risk"
            elif risk_percentage < 15:
                risk_level = "Moderate-High Risk"
            elif risk_percentage < 20:
                risk_level = "High Risk"
            else:
                risk_level = "Extreme Risk"
            
            # res = {
            #     "risk_percentage": risk_percentage,
            #     "risk_level": risk_level
            # }
            res = [risk_percentage, risk_level]
            return res
        except Exception as e:
            logger.error(f"Error categorizing risk level: {e}")
    
    def analyze_stock_risk(self, stock_symbol: str) -> Dict[str, Any]:
        """
        Perform a comprehensive risk analysis for a given stock.
        
        Args:
            stock_symbol (str): The stock ticker symbol
            
        Returns:
            Dict[str, Any]: Dictionary containing complete risk analysis
        """
        logger.info(f"Analyzing risk for {stock_symbol}")
        try:
            weights = {
                "volatility": 0.35, 
                "atr": 0.34,         
                "volume": 0.23,      
                "news": 0.08        
            }
            
            indicators = self.calculate_technical_indicators(stock_symbol)

            volatility_value = indicators[0]
            atr_value = indicators[1]
            last_close = indicators[2]
            avg_volume_value = indicators[3]
            
            news_json = news_agent.run(f"{stock_symbol}").content
            logger.info(f"Extracting news - \n{news_json}\n")

            news_impact = extract_rating(news_json)
            logger.info(f"Extracting rating - \n{news_impact}\n")
            
            # Normalize metrics
            normalized = self.normalize_metrics(
                volatility_value,
                atr_value,
                last_close,
                avg_volume_value,
                news_impact
            )
            
            # Calculate weighted risk
            normalized_metrics = [
                normalized[0], 
                normalized[1], 
                normalized[2], 
                normalized[3]
            ]
            weight_values = list(weights.values())
            
            risk_result = self.calculate_weighted_risk(normalized_metrics, weight_values)
            
            risk_percentage = risk_result
            
            # Categorize risk level
            risk_category = self.categorize_risk_level(risk_percentage)
            
            # Calculate individual contributions
            volatility_contribution = normalized[0] * weights["volatility"]
            atr_contribution = normalized[1] * weights["atr"]
            volume_contribution = normalized[2] * weights["volume"]
            news_contribution = normalized[3] * weights["news"]
            
            # Prepare final output
            current_date = datetime.today().strftime("%B %d, %Y")
            
            res = {
                "stock_symbol": stock_symbol,
                "analysis_date": current_date,
                "risk_percentage": risk_percentage,
                "risk_level": risk_category[1],
                "metrics": {
                    "volatility": {
                        "value": volatility_value,
                        "normalized": normalized[0],
                        "weight": weights["volatility"],
                        "contribution": volatility_contribution
                    },
                    "atr": {
                        "value": atr_value,
                        "normalized": normalized[1],
                        "weight": weights["atr"],
                        "contribution": atr_contribution
                    },
                    "volume": {
                        "value": avg_volume_value,
                        "normalized": normalized[2],
                        "weight": weights["volume"],
                        "contribution": volume_contribution
                    },
                    "news": {
                        "impact": news_impact,
                        "normalized": normalized[3],
                        "weight": weights["news"],
                        "contribution": news_contribution
                    }
                },
                "calculation_details": {
                    "volatility_contribution": volatility_contribution,
                    "atr_contribution": atr_contribution,
                    "volume_contribution": volume_contribution,
                    "news_contribution": news_contribution
                }
            }

            return str(res)
        
        except Exception as e:
            logger.error(f"Error in risk analysis: {e}")


risk_analysis_team = Agent(
    name="Risk Analysis Team",
    role="Synthesize data into concise risk assessment",
    model=azure_model,
    tools=[StockRiskTools()],
    instructions=[
        "Act as a NER to identify the stock symbols in the query. Stocks can be more than one",
        "Use the StockRiskTools for analysing risk for the given stock symbol.",
        "Provide confidence level (low, medium, high).",
        "Format output as a json or python dictionary. Keep it Concise",
        "Include risk factors and their significance in the analysis.",
        "If there are more than one stock is given, analyse the risk of each stock and give a final risk category for all the stocks combined."
        "Do not include any detailed data, news, or tool traces.",
    ],
    show_tool_calls=False,
    markdown=False,
)
    