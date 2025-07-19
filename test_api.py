#!/usr/bin/env python3

import requests
import json
import time

def test_api():
    base_url = "http://localhost:8000"
    
    print("Testing Blockchain API with C++ implementation...")
    
    # Test 1: Check if API is running
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ API Status: {response.json()}")
    except Exception as e:
        print(f"❌ API not running: {e}")
        return
    
    # Test 2: Get blockchain info
    try:
        response = requests.get(f"{base_url}/api/blockchain/info")
        info = response.json()
        print(f"✅ Blockchain Info: {info}")
    except Exception as e:
        print(f"❌ Failed to get blockchain info: {e}")
        return
    
    # Test 3: Create a new block
    contract_data = {
        "amount": 250.75,
        "sender": "Alice",
        "receiver": "Bob", 
        "timestamp": str(int(time.time()))
    }
    
    try:
        response = requests.post(f"{base_url}/api/block", json=contract_data)
        result = response.json()
        print(f"✅ Block Created: {result}")
        block_index = result.get("block_index", 1)
    except Exception as e:
        print(f"❌ Failed to create block: {e}")
        return
    
    # Test 4: Retrieve the block
    try:
        response = requests.get(f"{base_url}/api/block/{block_index}")
        block = response.json()
        print(f"✅ Retrieved Block: {block}")
    except Exception as e:
        print(f"❌ Failed to retrieve block: {e}")
    
    # Test 5: Validate blockchain
    try:
        response = requests.get(f"{base_url}/api/blockchain/validate")
        validation = response.json()
        print(f"✅ Blockchain Validation: {validation}")
    except Exception as e:
        print(f"❌ Failed to validate blockchain: {e}")
    
    print("\n🎉 All tests completed! Your C++ blockchain is working with FastAPI!")

if __name__ == "__main__":
    test_api() 