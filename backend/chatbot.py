from langchain_core.prompts import FewShotPromptTemplate, PromptTemplate
from langchain.chains.sql_database.prompt import PROMPT_SUFFIX
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_openai import AzureChatOpenAI
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)
CORS(app) 

MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
MONGODB_URI = os.getenv("MONGODB_URI")

llm= AzureChatOpenAI(
        api_key=AZURE_KEY,
        api_version="2023-03-15-preview",
        temperature=0,
        max_tokens=None,
        azure_endpoint=AZURE_ENDPOINT,
        azure_deployment=AZURE_DEPLOYMENT
)

db_user = "root"
db_password = MYSQL_PASSWORD
db_host = "localhost"
db_name = "finai"
connection_string = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"
db = SQLDatabase.from_uri(connection_string)

schema_prompt = """
You are a MySQL expert. Given an input question, first create a syntactically correct MySQL query to run, then look at the results of the query and return the answer to the input question.

Here is the schema for the database:

Tables:
1. `budget`
    - `username`: VARCHAR(45)
    - `category`: VARCHAR(45)
    - `budget_amt_categorized`: INT
    - `month`: VARCHAR(15)
    - `year`: INT

2. `expenses`
    - `username`: VARCHAR(45)
    - `category`: VARCHAR(45)
    - `expense_amt_categorized`: INT
    - `date`: DATE (format: YYYY-MM-DD)

The `budget` table stores the categorized budget for each user for every month and year. The `expenses` table stores categorized expenses made by users, with dates. You can join the `budget` and `expenses` tables on the `username` and `category` fields.

Pay attention to:
- The column names are provided in backticks (`).
- Use the `month` column to represent the name of the month (e.g., "April").
- Use the `year` column for filtering by year.
- Use the `category` column to differentiate spending categories (e.g., Entertainment, Home).
- Use the `expense_amt_categorized` to represent expenses for a specific category, and the `budget_amt_categorized` for allocated budget.

Use the following format:

Question: Question here
SQLQuery: Query to run with no preamble
SQLResult: Result of the SQL query
Answer: Final answer in natural language

The SQL query should be outputted plainly, do not surround it in quotes or anything else like markers ```sql```.
If the question is not related to the schema, budget, expense, then Don't answer.
If the user wants to group by month, only group by months in the SQL table.

No preamble. Only respond in the format shown below.
"""

example_prompt = PromptTemplate(
    input_variables=["Question", "SQLQuery", "SQLResult", "Answer"],
    template="\nQuestion: {Question}\nSQLQuery: {SQLQuery}\nSQLResult: {SQLResult}\nAnswer: {Answer}",
)

few_shots = [
    {
        'Question': "What is the budgeting done for Entertainment for Anbu@253 category this month?",
        'SQLQuery': """
            SELECT budget_amt_categorized 
            FROM budget
            WHERE category = 'Entertainment' 
            AND month = MONTHNAME(CURDATE()) 
            AND year = YEAR(CURDATE())
            AND username = 'Anbu@253';
        """,
        'SQLResult': "2000",
        'Answer': "Anbu@253 has budgeted 2000 for Entertainment this month."
    },
    {
        'Question': "How much did Anbu@253 save in the Entertainment category for April 2024?",
        'SQLQuery': """
            SELECT (b.budget_amt_categorized - COALESCE(e.total_expense, 0)) AS saved_amount 
            FROM budget b
            LEFT JOIN (
                SELECT username, category, SUM(expense_amt_categorized) AS total_expense 
                FROM expenses 
                WHERE MONTHNAME(date) = 'April' 
                AND YEAR(date) = 2024 
                AND category = 'Entertainment'
                GROUP BY username, category
            ) e ON b.username = e.username AND b.category = e.category
            WHERE b.username = 'Anbu@253' AND b.category = 'Entertainment' AND b.month = 'April' AND b.year = 2024;
        """,
        'SQLResult': "800",
        'Answer': "Anbu@253 saved 800 in the Entertainment category in April 2024."
    },
    {
    'Question': "Can you give Anbu@253 a budget for next month based on Anbu@253's previous spendings?",
    'SQLQuery': """
        SELECT category, AVG(expense_amt_categorized) AS average_spending
        FROM expenses
        WHERE username = 'Anbu@253'
        GROUP BY category;
    """,
    'SQLResult': [],
    'Answer': "Based on Anbu@253's previous spendings, the suggested budget for next month is:\n- Entertainment: 600\n- Food: 300\n- Utilities: 200\n- Transport: 150."
}
]

few_shot_prompt_with_schema = FewShotPromptTemplate(
    examples=few_shots,
    example_prompt=example_prompt,
    prefix=schema_prompt,
    suffix=PROMPT_SUFFIX, 
    input_variables=["input", "table_info", "top_k"],
)

db_chain = SQLDatabaseChain.from_llm(llm, db, verbose=True, prompt=few_shot_prompt_with_schema)

client = MongoClient(MONGODB_URI)
db_mongo = client.get_database('FinAI')
users_collection = db_mongo['users']

@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.json
    question = data.get('question', '')
    email = data.get('email', '')

    if not email:
        return jsonify({"error": "No email provided"}), 400

    user = users_collection.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    username = user.get('userName')
    if not username:
        return jsonify({"error": "Username not found for the provided email"}), 404

    if question:
        try:
            question = question.replace(" me ", f" {username} ").replace(" my ", f" {username}'s ").replace(" i ", "he")
            response = db_chain.invoke(question)
            print(response)

            ans = response['result']
            n_question = f"Question: {question} This is the answer from SQL Chain: {ans}. Give me correct formatted answer like a real answer to the question with answer from sql chain as context. Use ₹ symbol instead of $"
            n_response = llm.invoke(n_question)
            return jsonify({"response": n_response.content})
        except Exception as e:
            n_response = llm.invoke(question)
            return jsonify({"response": n_response.content})
    else:
        return jsonify({"error": "No question provided"}), 400
    
if __name__ == '__main__':
    app.run(port=5000, debug=True)