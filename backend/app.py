from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Allow requests from React frontend

# Connect to Ganache
web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

# Load contract ABI from file
try:
    with open('contract_abi.json') as f:
        contract_abi = json.load(f)
    print("ABI loaded successfully!")
except Exception as e:
    print("Error loading ABI:", e)
    contract_abi = None

# Contract address (replace with your deployed contract address)
contract_address = "0x4d7F9042f0408e8Dad5c10ce56c1898e79bd2C62"

# Initialize contract
if contract_abi:
    contract = web3.eth.contract(address=contract_address, abi=contract_abi)
else:
    print("ABI not loaded. Exiting...")
    exit(1)

# Store user requests (in-memory for simplicity)
user_requests = []

@app.route("/request_access", methods=["POST"])
def request_access():
    data = request.json
    user_requests.append({
        "user_address": data["user_address"],
        "resource": data["resource"],
        "duration": data["duration"],
    })
    return jsonify({"message": "Access request submitted"}), 200

@app.route("/get_requests", methods=["GET"])
def get_requests():
    return jsonify(user_requests), 200

@app.route("/grant_access", methods=["POST"])
def grant_access():
    try:
        data = request.json
        account = web3.eth.accounts[0]  # Admin account

        # Call the `issueToken` function in the smart contract
        tx_hash = contract.functions.issueToken(
            data["user_address"], data["resource"], data["duration"]
        ).transact({"from": account})

        # Wait for the transaction to be mined
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        # Process the event logs to extract the token ID
        event_signature = web3.keccak(text="TokenIssued(uint256,address,string,uint256)").hex()
        logs = receipt["logs"]

        token_id = None
        for log in logs:
            if log["topics"][0].hex() == event_signature:
                # Decode the log data
                token_id = int.from_bytes(log["topics"][1], byteorder="big")
                break

        if token_id is None:
            raise ValueError("TokenIssued event not found in logs")

        # Remove the request after granting access
        global user_requests
        user_requests = [req for req in user_requests if req["user_address"] != data["user_address"]]
        
        return jsonify({"tx_hash": tx_hash.hex(), "token_id": token_id}), 200
    except Exception as e:
        print("Error in grant_access:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/revoke_access", methods=["POST"])
def revoke_access():
    try:
        data = request.json
        account = web3.eth.accounts[4]

        # Check if the token is valid before revoking
        is_valid = contract.functions.isTokenValid(data["tokenId"]).call()
        if not is_valid:
            return jsonify({"error": "Token is already revoked or invalid"}), 400

        # Call the `revokeToken` function in the smart contract
        tx_hash = contract.functions.revokeToken(data["tokenId"]).transact({"from": account})
        
        return jsonify({"tx_hash": tx_hash.hex()}), 200
    except Exception as e:
        print("Error in revoke_access:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/check_access/<int:tokenId>", methods=["GET"])
def check_access(tokenId):
    try:
        # Call the `isTokenValid` function in the smart contract
        is_valid = contract.functions.isTokenValid(tokenId).call()
        return jsonify({"valid": is_valid}), 200
    except Exception as e:
        print("Error in check_access:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)