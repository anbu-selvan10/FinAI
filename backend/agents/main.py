from flask import Flask, jsonify, request
from flask_cors import CORS
from stock_analyst import advisor_workflow
from text2sql import query_engine
from portfolio import portfolio_advisor_workflow

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

        if not question:
            return jsonify({"error": "No question provided"}), 400

        response = advisor_workflow.run(question).content
        print(response)

        responseDict = {"response": response}

        return jsonify(responseDict)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/portfolio_ask', methods=['POST'])
def get_portfolio_response():
    try:
        data = request.json
        username = data.get("username", "")
        question = data.get("question", "")

        if not question:
            return jsonify({"error": "No question provided"}), 400

        response = portfolio_advisor_workflow.run(f"{question} with {username}").content

        responseDict = {"response": response}

        return jsonify(responseDict)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
