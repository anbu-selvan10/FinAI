from langchain_google_genai import GoogleGenerativeAI
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_community.vectorstores.chroma import Chroma
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.prompts import SemanticSimilarityExampleSelector, FewShotPromptTemplate, PromptTemplate
from langchain.chains.sql_database.prompt import PROMPT_SUFFIX, _mysql_prompt

llm = GoogleGenerativeAI(model="models/text-bison-001", google_api_key="", temperature=0.1)

db_user = "root"
db_password = "vivek220105"
db_host = "localhost"
db_name = "finai"

connection_string = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"
db = SQLDatabase.from_uri(connection_string)

few_shots = [
    {
    'Question': "What is the budgeting done for Entertainment for Anbu@253 category this month?",
    'SQLQuery': """
        SELECT budget_amt_categorized 
        FROM budget
        WHERE category = 'Entertainment' 
        AND month = MONTHNAME(CURDATE()) 
        AND year = YEAR(CURDATE())
        AND username = 'Anbu@253'
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "2000"
    },
    {
    'Question': "If Anbu@2534 didn't allocate any budget for Entertainment, how much can he saves?",
    'SQLQuery': """
        SELECT 
        (SELECT SUM(budget_amt_categorized) 
        FROM budget
        WHERE category != 'Entertainment'
        AND month = MONTHNAME(CURDATE()) 
        AND username = 'Anbu@2534'
        AND year = YEAR(CURDATE()))
        -
        (SELECT SUM(budget_amt_categorized) 
        FROM budget
        WHERE category = 'Entertainment'
        AND username = 'Anbu@2534'
        AND month = MONTHNAME(CURDATE()) 
        AND year = YEAR(CURDATE()));
        AS potential_savings
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "2000"
    },
    {
    'Question': "What is the percentage of budget allocated for the personal category by Anbu@253 in April 2024?",
    'SQLQuery': """
        SELECT 
        (SUM(budget_amt_categorized) / 
        (SELECT SUM(budget_amt_categorized) 
        FROM budget 
        WHERE month = 'April'
        AND username = 'Anbu@253'
        AND year = YEAR(CURDATE()))) * 100 AS percentage_budget 
        FROM budget
        WHERE category = 'Personal' 
        AND month = 'April'
        AND username = 'Anbu@253'
        AND year = YEAR(CURDATE());
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "50.0000"
    },
    {
    'Question': "How does Anbu@253 allocated budget for entertainment this month compare to last month?",
    'SQLQuery': """
        SELECT 
        (SELECT SUM(budget_amt_categorized) 
        FROM budget
        WHERE category = 'Entertainment' 
        AND month = MONTHNAME(CURDATE()) 
        AND username = 'Anbu@253'
        AND year = YEAR(CURDATE())) 
        - 
        (SELECT SUM(budget_amt_categorized) 
        FROM budget
        WHERE category = 'Entertainment' 
        AND username = 'Anbu@253'
        AND month = MONTHNAME(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
        AND year = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))) 
        AS budget_difference;
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "1000"
    },
    {
    'Question': "Which category have Anbu@253 spent too much on this month?",
    'SQLQuery': """
        SELECT 
        category,
        SUM(expense_amt_categorized) AS total_expense 
        FROM 
            expenses 
        WHERE 
            MONTH(date) = MONTH(CURDATE()) 
            AND YEAR(date) = YEAR(CURDATE())
            AND username = 'Anbu@253'
        GROUP BY 
            category
        ORDER BY 
            total_expense DESC
        LIMIT 1
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "Home 200"
    },
    {
    'Question': "Over the last 6 months, in which month have Anbu@253 spent the most?",
    'SQLQuery': """
        SELECT 
        YEAR(date) AS year,
        MONTHNAME(date) AS month,
        SUM(expense_amt_categorized) AS total_expense 
        FROM 
        expenses 
        WHERE 
        STR_TO_DATE(date, '%Y-%m-%d') >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND username = "Anbu@253"
        GROUP BY 
        year, month
        ORDER BY 
        total_expense DESC
        LIMIT 1
    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "2024 May 770"
    },
    {
    'Question': "How much did Anbu@253 save in entertainment category for April 2024?",
    'SQLQuery': """
        SELECT (b.budget_amt_categorized - COALESCE(e.total_expense, 0)) AS saved_amount 
        FROM finai.budget b
        LEFT JOIN (
        SELECT 
        username,
        category,
        SUM(expense_amt_categorized) AS total_expense 
        FROM 
        finai.expenses 
        WHERE 
        MONTHNAME(STR_TO_DATE(date, '%Y-%m-%d')) = "April"
        AND YEAR(STR_TO_DATE(date, '%Y-%m-%d')) = 2024
        AND category = 'Entertainment'
        GROUP BY 
        username, category
        ) e ON b.username = e.username AND b.category = e.category
        WHERE 
        b.username = 'Anbu@253'
        AND b.category = 'Entertainment'
        AND b.month = "April" 
        AND b.year = 2024;

    """,
    'SQLResult': "Result of the SQL query",
    'Answer': "800"
    }
]

embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
to_vectorize = [" ".join(example.values()) for example in few_shots]
vectorstore = Chroma.from_texts(to_vectorize, embeddings, metadatas=few_shots)
example_selector = SemanticSimilarityExampleSelector(
    vectorstore=vectorstore,
    k=2,
)
mysql_prompt = """You are a MySQL expert. Given an input question, first create a syntactically correct MySQL query to run, then look at the results of the query and return the answer to the input question.
Unless the user specifies in the question a specific number of examples to obtain, query for at most {top_k} results using the LIMIT clause as per MySQL. You can order the results to return the most informative data in the database.
Never query for all columns from a table. You must query only the columns that are needed to answer the question. Wrap each column name in backticks (`) to denote them as delimited identifiers.
Pay attention to use only the column names you can see in the tables below. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table.
Pay attention to use CURDATE() function to get the current date, if the question involves "today".
Pay attention to use month name instead of month number for `month` for the budget table.
Pay attention to use correct username.
Pay attention to total_expense. There is no column called total_expense. For total_expense sum(expense_amt_categorized) for that month.

Use the following format:

Question: Question here
SQLQuery: Query to run with no pre-amble
SQLResult: Result of the SQLQuery
Answer: Final answer here

No pre-amble.
"""

example_prompt = PromptTemplate(
    input_variables=["Question", "SQLQuery", "SQLResult","Answer",],
    template="\nQuestion: {Question}\nSQLQuery: {SQLQuery}\nSQLResult: {SQLResult}\nAnswer: {Answer}",
)

few_shot_prompt = FewShotPromptTemplate(
    example_selector=example_selector,
    example_prompt=example_prompt,
    prefix=mysql_prompt,
    suffix=PROMPT_SUFFIX,
    input_variables=["input", "table_info", "top_k"],
)

db_chain = SQLDatabaseChain.from_llm(llm, db, verbose=True, prompt=few_shot_prompt)

print(db_chain.invoke("How much percentage of budget was allocated to Groceries this month by Vivek@123?"))