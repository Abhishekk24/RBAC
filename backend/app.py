from flask import Flask, request, jsonify
from flask_cors import CORS
from web3 import Web3
import json
import time
import os
from dotenv import load_dotenv
from eth_account import Account

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"]) 

alchemy_url = os.getenv("ALCHEMY_URL")
web3 = Web3(Web3.HTTPProvider(alchemy_url))

private_key = os.getenv("ADMIN_PRIVATE_KEY")
admin_address = web3.eth.account.from_key(private_key).address
try:
    with open('contract_abi.json') as f:
        contract_abi = json.load(f)
    print("✅ ABI loaded successfully!")
except Exception as e:
    print("❌ Error loading ABI:", e)
    contract_abi = None

contract_address = "0x57BEAd49c010f0B933E286EFfA8A89f42ec3B8e7"

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
        user_address = data["user_address"]
        resource = data["resource"]
        duration = int(data["duration"])

        nonce = web3.eth.get_transaction_count(admin_address)
        txn = contract.functions.issueToken(user_address, resource, duration).build_transaction({
            "from": admin_address,
            "nonce": nonce,
            "gas": 300000,
            "gasPrice": web3.to_wei("30", "gwei"),
            "chainId": web3.eth.chain_id
        })

        signed_txn = Account.sign_transaction(txn, private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        event_logs = contract.events.TokenIssued().process_receipt(receipt)
        if not event_logs:
            raise ValueError("❌ TokenIssued event not found in logs")

        token_id = event_logs[0]["args"]["tokenId"]

        global user_requests
        user_requests = [req for req in user_requests if req["user_address"] != user_address]

        return jsonify({"tx_hash": tx_hash.hex(), "token_id": token_id}), 200

    except Exception as e:
        print("🔥 Error in grant_access:", str(e))
        return jsonify({"error": str(e)}), 500



@app.route("/revoke_access", methods=["POST"])
def revoke_access():
    try:
        data = request.json
        token_id = int(data["tokenId"])

        is_valid = contract.functions.isTokenValid(token_id).call()
        if not is_valid:
            error_message = "⚠️ Token already expired, cannot revoke"
            print(error_message)
            return jsonify({"error": error_message}), 400

        print(f"🔹 Revoking token ID {token_id} from admin {admin_address}")

        nonce = web3.eth.get_transaction_count(admin_address)
        txn = contract.functions.revokeToken(token_id).build_transaction({
            "from": admin_address,
            "nonce": nonce,
            "gas": 200000,
            "gasPrice": web3.to_wei("30", "gwei"),
            "chainId": web3.eth.chain_id
        })

        signed_txn = Account.sign_transaction(txn, private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)

        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        print(f"✅ Revoked successfully with tx: {tx_hash.hex()}")
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