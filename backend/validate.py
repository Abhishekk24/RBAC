import json

with open('contract_abi.json') as f:
    try:
        json.load(f)
        print("JSON is valid!")
    except json.JSONDecodeError as e:
        print("Invalid JSON:", e)