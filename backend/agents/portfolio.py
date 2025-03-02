from phi.agent import Agent
from phi.model.google import Gemini
from phi.tools.googlesearch import GoogleSearch
import os
from dotenv import load_dotenv

load_dotenv(r"..\.env")

GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')

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