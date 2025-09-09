#!/usr/bin/env python3
"""
Test script for the blockchain integration
This script demonstrates the complete workflow from frontend to blockchain
"""

import requests
import json
import time
from datetime import datetime

# API Configuration
API_BASE = "http://localhost:8000"

def test_api_health():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print("✓ API is running and healthy")
            return True
        else:
            print(f"✗ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Failed to connect to API: {e}")
        return False

def test_blockchain_info():
    """Test blockchain info endpoint"""
    try:
        response = requests.get(f"{API_BASE}/api/blockchain/info")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Blockchain Info: {data['chain_size']} blocks, Valid: {data['is_valid']}")
            return data
        else:
            print(f"✗ Blockchain info failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Failed to get blockchain info: {e}")
        return None

def login_user():
    """Login with demo user"""
    try:
        login_data = {
            "user_id": "alice001",
            "user_password": "password123"
        }
        response = requests.post(f"{API_BASE}/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            print(f"✓ Logged in as {data['user']['user_name']}")
            return token
        else:
            print(f"✗ Login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"✗ Login error: {e}")
        return None

def create_test_block(token):
    """Create a test block"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        block_data = {
            "amount": 50000.0,
            "sender": "ABC Company",
            "receiver": "XYZ Corporation",
            "timestamp": str(int(time.time()))
        }
        
        response = requests.post(f"{API_BASE}/api/block", json=block_data, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Block created successfully: Index {data['block_index']}")
            return data['block_index']
        else:
            print(f"✗ Block creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Block creation error: {e}")
        return None

def test_blockchain_export(token):
    """Test blockchain export functionality"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/api/blockchain/export", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Blockchain export successful: {len(data['blocks'])} blocks exported")
            
            # Save to file
            filename = f"blockchain_test_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✓ Exported blockchain data to {filename}")
            return True
        else:
            print(f"✗ Blockchain export failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Blockchain export error: {e}")
        return False

def test_block_retrieval(token, block_index):
    """Test retrieving a specific block"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/api/block/{block_index}", headers=headers)
        if response.status_code == 200:
            data = response.json()
            block = data['block']
            print(f"✓ Block {block_index} retrieved:")
            print(f"  Hash: {block['hash'][:16]}...")
            print(f"  Amount: ${block['data']['amount']:,.2f}")
            print(f"  Valid: {block['is_valid']}")
            return True
        else:
            print(f"✗ Block retrieval failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Block retrieval error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Blockchain Integration")
    print("=" * 50)
    
    # Test API health
    if not test_api_health():
        print("❌ API is not running. Please start the API server first.")
        return
    
    # Test blockchain info
    blockchain_info = test_blockchain_info()
    if not blockchain_info:
        return
    
    # Login
    token = login_user()
    if not token:
        return
    
    # Create test block
    block_index = create_test_block(token)
    if block_index is not None:
        # Test block retrieval
        test_block_retrieval(token, block_index)
    
    # Test blockchain export
    test_blockchain_export(token)
    
    # Final blockchain info
    print("\n" + "=" * 50)
    print("📊 Final Blockchain State:")
    final_info = test_blockchain_info()
    
    print("\n✅ All tests completed!")
    print("\n🎯 Next steps:")
    print("1. Open http://localhost:3000 to access the frontend")
    print("2. Login with alice001 / password123")
    print("3. Visit the Blockchain Explorer page")
    print("4. Try creating blocks manually")
    print("5. Export blockchain data as JSON")

if __name__ == "__main__":
    main()
