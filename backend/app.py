from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json
import time

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"]) 

web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

try:
    with open('contract_abi.json') as f:
        contract_abi = json.load(f)
    print("✅ ABI loaded successfully!")
except Exception as e:
    print("❌ Error loading ABI:", e)
    contract_abi = None

contract_address = "0xaCc0EE450a8699856eFE82f825Ae4bB7cC5D3Fb4"

if contract_abi:
    contract = web3.eth.contract(address=contract_address, abi=contract_abi)
else:
    print("❌ ABI not loaded. Exiting...")
    exit(1)

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

@app.route("/get_token_status", methods=["POST"])  
def get_token_status():
    try:
        data = request.get_json()
        token_list = data.get("tokens", []) 

        token_statuses = []
        for token_id in token_list:
            try:
                is_valid = contract.functions.isTokenValid(token_id).call()
                expiry_time = contract.functions.getTokenExpiry(token_id).call()
                remaining_time = max(0, expiry_time - int(time.time()))  

                token_statuses.append({
                    "tokenId": token_id,
                    "status": "Valid" if is_valid else "Invalid",
                    "remaining_time": remaining_time
                })
            except Exception as e:
                print(f"⚠️ Error fetching token {token_id}: {str(e)}")

        return jsonify(token_statuses), 200
    except Exception as e:
        print(f"🔥 Error fetching token statuses: {str(e)}")
        return jsonify({"error": "Failed to fetch token statuses"}), 500

@app.route("/grant_access", methods=["POST"])
def grant_access():
    try:
        data = request.json
        account = web3.eth.accounts[0] 

        tx_hash = contract.functions.issueToken(
            data["user_address"], data["resource"], data["duration"]
        ).transact({"from": account})

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        event_logs = contract.events.TokenIssued().process_receipt(receipt)
        if not event_logs:
            raise ValueError("❌ TokenIssued event not found in logs")

        token_id = event_logs[0]["args"]["tokenId"]  

        global user_requests
        user_requests = [req for req in user_requests if req["user_address"] != data["user_address"]]
        
        return jsonify({"tx_hash": tx_hash.hex(), "token_id": token_id}), 200
    except Exception as e:
        print("🔥 Error in grant_access:", str(e))
        return jsonify({"error": str(e)}), 500

def get_admin_address():
    return contract.functions.admin().call()

@app.route("/revoke_access", methods=["POST"])
def revoke_access():
    try:
        data = request.json
        token_id = int(data["tokenId"]) 

        admin_address = get_admin_address()

        is_valid = contract.functions.isTokenValid(token_id).call()
        if not is_valid:
            error_message = "⚠️ Token already expired, cannot revoke"
            print(error_message)
            return jsonify({"error": error_message}), 400 

        print(f"🔹 Revoking token ID {token_id} from admin {admin_address}")

        tx_hash = contract.functions.revokeToken(token_id).transact({
            "from": admin_address
        })

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return jsonify({"tx_hash": tx_hash.hex()}), 200
    except Exception as e:
        error_message = str(e)
        print(f"🔥 Error in revoke_access: {error_message}")
        if "revert" in error_message:
            error_message = "Token already expired, cannot revoke"

        return jsonify({"error": error_message}), 500

@app.route("/check_access/<int:tokenId>", methods=["GET"])
def check_access(tokenId):
    try:
        print(f"🔎 Checking access for Token ID: {tokenId}")

        is_valid = contract.functions.isTokenValid(tokenId).call()

        print(f"✅ Token {tokenId} valid: {is_valid}")

        return jsonify({"valid": is_valid}), 200
    except Exception as e:
        print("🔥 Error in check_access:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
