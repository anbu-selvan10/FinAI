from flask import Flask, jsonify, request
from flask_cors import CORS
from stock_analyst import advisor_workflow
from text2sql import query_engine
from portfolio import portfolio_advisor_workflow
from spending_pattern import spending_analyser
from pymongo import MongoClient
import os
import random
import time
from dotenv import load_dotenv

load_dotenv(r"..\.env")

client = MongoClient(os.getenv("MONGODB_URI"))
db = client['FinAI']
users_collection = db['users']
sessions_collection = db['stock']

app = Flask(__name__)

CORS(app)

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



@app.route('/ask', methods=['POST'])
def get_analyst_response():
    try:
        data = request.json
        question = data.get("question", "")
        email = data.get("email", "")
        session_id = data.get("session_id", "")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = users_collection.find_one({"email": email})

        if not user:
            return jsonify({"error": "User not found"}), 404

        username = user.get("userName", "Anonymous")

        if not question:
            return jsonify({"error": "No question provided"}), 400

        if not session_id:
            while True:
                new_session_id = str(random.randint(0, 1000000))
                existing_session = sessions_collection.find_one({"session_id": new_session_id})
                if not existing_session:
                    session_id = new_session_id
                    break

            new_session = {
                "session_id": session_id,
                "user_id": username,  
                "memory": {
                    "runs": []
                },
                "created_at": int(time.time()),
                "updated_at": int(time.time())
            }

            sessions_collection.insert_one(new_session)

        response = advisor_workflow.run(question).content
        advisor_workflow.save_to_db(question, response, username, session_id)

        return jsonify({
            "response": response,
            "session_id": session_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/portfolio_ask', methods=['POST'])
def get_portfolio_response():
    try:
        data = request.json
        email = data.get("email", "")
        question = data.get("question", "")
        session_id = data.get("session_id", "")

        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = users_collection.find_one({"email": email})

        if user:
            username = user.get("userName")
        else:
            return jsonify({"error": "User not found"}), 404

        if not question:
            return jsonify({"error": "No question provided"}), 400

        response = portfolio_advisor_workflow.run(f"{question} with username {username}").content
        print(response)
        portfolio_advisor_workflow.save_to_db(question, response, username, session_id)

        responseDict = {"response": response}

        return jsonify(responseDict)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/predict-budget', methods=['POST'])
def predict_budget():
    data = request.json
    user_budget = data.get('user_budget')
    username = data.get('username')

    # Call spending_analyser function
    rounded_category_sums, rounded_cat_sum = spending_analyser(user_budget, username)
    
    # Convert numpy int64 to native Python int
    prediction_result = {
        category: int(value) for category, value in rounded_category_sums.items()
    }
    print(prediction_result)
    return jsonify({
        "result": prediction_result, 
        "total_budget": int(rounded_cat_sum)
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
