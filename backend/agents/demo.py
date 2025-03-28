#Demo for storing session
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

try:
    from pymongo import MongoClient
    from pymongo.database import Database
    from pymongo.collection import Collection
    from pymongo.errors import PyMongoError
except ImportError:
    raise ImportError("`pymongo` not installed. Please install it with `pip install pymongo`")

from phi.workflow import WorkflowSession
from phi.storage.workflow.base import WorkflowStorage
from phi.utils.log import logger
import time
import json
import time
from typing import Optional, Iterator
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError
from phi.agent import Agent
from phi.workflow import Workflow, RunResponse, RunEvent
from phi.storage.workflow.mongodb import MongoWorkflowStorage
from phi.workflow import WorkflowSession
from phi.tools.duckduckgo import DuckDuckGo
from phi.utils.pprint import pprint_run_response
from phi.utils.log import logger
from risk_analyst import gemini_model
from dotenv import load_dotenv
import os

load_dotenv(r"..\.env")

MONGODB_URI=os.getenv("MONGODB_URI")
DB_NAME = "FinAI"
COLLECTION_NAME = "chatbot"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

class NewsArticle(BaseModel):
    title: str = Field(..., description="Title of the article.")
    url: str = Field(..., description="Link to the article.")
    summary: Optional[str] = Field(..., description="Summary of the article if available.")


class SearchResults(BaseModel):
    articles: list[NewsArticle]

class BlogPostGenerator(Workflow):
    searcher: Agent = Agent(
        model=gemini_model,
        tools=[DuckDuckGo()],
        instructions=["Given a topic, search for the top 5 articles."],
        response_model=SearchResults,
        structured_outputs=True,
    )

    writer: Agent = Agent(
        model=gemini_model,
        instructions=[
            "You will be provided with a topic and a list of top articles on that topic.",
            "Carefully read each article and generate a New York Times worthy blog post on that topic.",
            "Break the blog post into sections and provide key takeaways at the end.",
            "Make sure the title is catchy and engaging.",
            "Always provide sources, do not make up information or sources.",
        ],
        markdown=True,
    )

    def run(self, topic: str) -> RunResponse:
        logger.info(f"Generating a blog post on: {topic}")

        search_results = self.get_search_results(topic)
        if not search_results:
            return RunResponse(content="No search results found.", event=RunEvent.workflow_completed)

        blog_post_response = self.write_blog_post(topic, search_results)
        self.save_to_db(topic, blog_post_response.content)

        return blog_post_response

    def get_search_results(self, topic: str) -> Optional[SearchResults]:
        MAX_ATTEMPTS = 3
        for attempt in range(MAX_ATTEMPTS):
            try:
                response: RunResponse = self.searcher.run(topic)
                if response and response.content:
                    return response.content
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{MAX_ATTEMPTS} failed: {str(e)}")
        return None

    def write_blog_post(self, topic: str, search_results: SearchResults) -> RunResponse:
        logger.info("Writing blog post")
        writer_input = {"topic": topic, "articles": search_results}
        return self.writer.run(json.dumps(writer_input, indent=4))


    def save_to_db(self, topic: str, response: str):
        session_id = f"generate-blog-post-on-{topic.lower().replace(' ', '-')}"
        current_timestamp = int(time.time())  # Get the current Unix timestamp

        session_data = collection.find_one({"session_id": session_id})

        if session_data:
            # Update existing session
            collection.update_one(
                {"session_id": session_id},
                {
                    "$push": {"memory.runs": {"input": topic, "response": response}},
                    "$set": {"updated_at": current_timestamp},
                    "$unset": {  # Remove fields that are null
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
                "user_id": "anbu",
                "memory": {"runs": [{"input": topic, "response": response}]},
                "created_at": current_timestamp,
                "updated_at": current_timestamp,  # Initialize updated_at as well
            }
            collection.insert_one(new_session)

if __name__ == "__main__":
    from rich.prompt import Prompt
    topic = Prompt.ask("[bold]Enter a blog post topic[/bold]", default="Why Cats Secretly Run the Internet")
    generator = BlogPostGenerator(session_id=f"generate-blog-post-on-{topic.lower().replace(' ', '-')}" )
    blog_post = generator.run(topic=topic)
    pprint_run_response(blog_post, markdown=True)
