from llama_index.llms.azure_openai import AzureOpenAI
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Date, Numeric
from llama_index.core import SQLDatabase
from llama_index.embeddings.azure_openai import AzureOpenAIEmbedding
from llama_index.core import Settings
from llama_index.core.query_engine import NLSQLTableQueryEngine
from dotenv import load_dotenv
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sqlalchemy.orm import sessionmaker

load_dotenv(r"..\.env")

app = Flask(__name__)
CORS(app) 

SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_DB = os.getenv('SUPABASE_DB')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
AZURE_KEY = os.getenv("AZURE_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT")
AZURE_EMBEDDINGS_KEY = os.getenv("AZURE_EMBEDDINGS_KEY")
AZURE_EMBEDDINGS_ENDPOINT = os.getenv("AZURE_EMBEDDINGS_ENDPOINT")
AZURE_EMBEDDINGS_DEPLOYMENT = os.getenv("AZURE_EMBEDDINGS_DEPLOYMENT")
MONGODB_URI = os.getenv("MONGODB_URI")

llm = AzureOpenAI(
    engine=AZURE_DEPLOYMENT,
    model=AZURE_DEPLOYMENT,
    temperature=0.0,
    azure_endpoint=AZURE_ENDPOINT,
    api_key=AZURE_KEY,
    api_version="2023-03-15-preview",
    system_prompt='''
    You are an expert SQL generator.
    Convert natural language to SQL based on the provided database schema.
    Ensure correct joins and conditions.
    For analysis of expenses, sum the expenses of particular days of each category by month.
    The amount is rupees not dollars.
    '''
)

client = MongoClient(MONGODB_URI)
db_mongo = client.get_database('FinAI')
users_collection = db_mongo['users']

engine = create_engine(f"postgresql+psycopg2://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}")
meta = MetaData()

budget = Table(
    'budget', meta,
    Column('id', String), 
    Column('month', String), 
    Column('year', Integer), 
    Column('username', String),
    Column('category', String),
    Column('budget_amt_categorized', Integer)
)

expenses = Table(
    'expenses', meta,
    Column('id', String),
    Column('date', Date),  
    Column('username', String),
    Column('category', String),
    Column('expense_amt_categorized', Numeric)
)

sql_database = SQLDatabase(engine, include_tables=["budget", "expenses"])

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

Settings.embed_model = AzureOpenAIEmbedding(
    deployment_name=AZURE_EMBEDDINGS_DEPLOYMENT,
    api_key=AZURE_EMBEDDINGS_KEY,
    azure_endpoint=AZURE_EMBEDDINGS_ENDPOINT,
)

query_engine = NLSQLTableQueryEngine(
    sql_database=sql_database, tables=["budget", "expenses"], llm=llm
)

with engine.connect() as connection:
    print("Connection Successful\n")

@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.json
    question = data.get('question', '')
    email = data.get('email', '')
    
    response = query_engine.query(question)

    print(response)
    
    return jsonify({
        'response': str(response),
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)