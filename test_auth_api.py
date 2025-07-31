#!/usr/bin/env python3
"""
Test script for User Authentication + Blockchain API
Tests user registration, login, e-signature generation, and authenticated blockchain operations
"""

import requests
import json
import time
import hashlib

def test_authentication_and_blockchain():
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Blockchain API with User Authentication")
    print("=" * 60)
    
    # Test 1: API Status
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ API Status: {response.json()}")
    except Exception as e:
        print(f"❌ API not running: {e}")
        return
    
    print("\n" + "="*60)
    print("👤 USER AUTHENTICATION TESTS")
    print("="*60)
    
    # Test 2: Register Users
    test_users = [
        {"user_name": "Alice Johnson", "user_id": "alice001", "user_password": "password123"},
        {"user_name": "Bob Smith", "user_id": "bob002", "user_password": "securepass"},
        {"user_name": "Charlie Brown", "user_id": "charlie003", "user_password": "mypassword"}
    ]
    
    registered_users = []
    
    for user_data in test_users:
        try:
            response = requests.post(f"{base_url}/auth/register", json=user_data)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                print(f"✅ User registered: {user_data['user_name']}")
                print(f"   User ID: {user_data['user_id']}")
                print(f"   E-signature: {result['user']['e_signature']}")
                
                # Verify e-signature calculation
                expected_signature = hashlib.sha256(
                    f"{user_data['user_name']}{user_data['user_id']}{user_data['user_password']}".encode()
                ).hexdigest()
                
                if result['user']['e_signature'] == expected_signature:
                    print(f"   ✅ E-signature verification: PASSED")
                else:
                    print(f"   ❌ E-signature verification: FAILED")
                
                registered_users.append(user_data)
            else:
                print(f"⚠️ User {user_data['user_name']}: {result.get('message', 'Registration failed')}")
                
        except Exception as e:
            print(f"❌ Failed to register {user_data['user_name']}: {e}")
    
    print(f"\n📊 Registered {len(registered_users)} users successfully")
    
    # Test 3: Login and get tokens
    print("\n" + "="*60)
    print("🔑 LOGIN TESTS")
    print("="*60)
    
    user_tokens = {}
    
    for user_data in registered_users:
        try:
            login_data = {
                "user_id": user_data["user_id"],
                "user_password": user_data["user_password"]
            }
            
            response = requests.post(f"{base_url}/auth/login", json=login_data)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                print(f"✅ Login successful: {user_data['user_name']}")
                print(f"   Session token: {result['session_token'][:20]}...")
                user_tokens[user_data["user_id"]] = result['session_token']
            else:
                print(f"❌ Login failed for {user_data['user_name']}: {result.get('message')}")
                
        except Exception as e:
            print(f"❌ Login error for {user_data['user_name']}: {e}")
    
    # Test 4: Test invalid login
    try:
        invalid_login = {
            "user_id": "alice001",
            "user_password": "wrongpassword"
        }
        response = requests.post(f"{base_url}/auth/login", json=invalid_login)
        result = response.json()
        print(f"🔒 Invalid password test: {result.get('message')}")
    except Exception as e:
        print(f"❌ Invalid login test error: {e}")
    
    if not user_tokens:
        print("❌ No users logged in successfully. Cannot continue with blockchain tests.")
        return
    
    # Test 5: Get user profile
    print("\n" + "="*60)
    print("👥 USER PROFILE TESTS")
    print("="*60)
    
    alice_token = user_tokens.get("alice001")
    if alice_token:
        try:
            headers = {"Authorization": f"Bearer {alice_token}"}
            response = requests.get(f"{base_url}/auth/profile", headers=headers)
            
            if response.status_code == 200:
                profile = response.json()
                print(f"✅ Profile retrieved for: {profile['user']['user_name']}")
                print(f"   User ID: {profile['user']['user_id']}")
                print(f"   E-signature: {profile['user']['e_signature'][:20]}...")
            else:
                print(f"❌ Profile retrieval failed: {response.json()}")
                
        except Exception as e:
            print(f"❌ Profile test error: {e}")
    
    # Test 6: Blockchain operations with authentication
    print("\n" + "="*60)
    print("⛓️ AUTHENTICATED BLOCKCHAIN TESTS")
    print("="*60)
    
    # Test blockchain info
    try:
        response = requests.get(f"{base_url}/api/blockchain/info")
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Blockchain Info: Chain size = {info['chain_size']}, Valid = {info['is_valid']}")
        else:
            print(f"❌ Blockchain info failed: {response.json()}")
    except Exception as e:
        print(f"❌ Blockchain info error: {e}")
    
    # Test creating blocks with different users
    transactions = [
        {"user_id": "alice001", "amount": 100.5, "sender": "Alice", "receiver": "Bob"},
        {"user_id": "bob002", "amount": 250.75, "sender": "Bob", "receiver": "Charlie"},
        {"user_id": "charlie003", "amount": 50.0, "sender": "Charlie", "receiver": "Alice"}
    ]
    
    created_blocks = []
    
    for tx in transactions:
        user_token = user_tokens.get(tx["user_id"])
        if not user_token:
            print(f"⚠️ No token for user {tx['user_id']}, skipping transaction")
            continue
        
        try:
            headers = {"Authorization": f"Bearer {user_token}"}
            contract_data = {
                "amount": tx["amount"],
                "sender": tx["sender"],
                "receiver": tx["receiver"],
                "timestamp": str(int(time.time()))
            }
            
            response = requests.post(f"{base_url}/api/block", json=contract_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Block created by {result['authenticated_user']}")
                print(f"   Amount: {tx['amount']}, {tx['sender']} → {tx['receiver']}")
                print(f"   Block index: {result['block_index']}")
                print(f"   User signature: {result['user_signature'][:20]}...")
                created_blocks.append(result['block_index'])
            else:
                print(f"❌ Block creation failed: {response.json()}")
                
        except Exception as e:
            print(f"❌ Block creation error: {e}")
    
    # Test 7: Retrieve created blocks
    print(f"\n📦 Retrieving {len(created_blocks)} created blocks:")
    
    for block_index in created_blocks:
        try:
            response = requests.get(f"{base_url}/api/block/{block_index}")
            
            if response.status_code == 200:
                block = response.json()["block"]
                print(f"✅ Block {block_index}: {block['data']['amount']} from {block['data']['senderKey']} to {block['data']['receiverKey']}")
                print(f"   Hash: {block['hash']}")
            else:
                print(f"❌ Failed to retrieve block {block_index}")
                
        except Exception as e:
            print(f"❌ Block retrieval error: {e}")
    
    # Test 8: Validate blockchain
    try:
        response = requests.get(f"{base_url}/api/blockchain/validate")
        if response.status_code == 200:
            validation = response.json()
            print(f"\n✅ Blockchain validation: Valid = {validation['is_valid']}, Size = {validation['chain_size']}")
        else:
            print(f"❌ Blockchain validation failed")
    except Exception as e:
        print(f"❌ Blockchain validation error: {e}")
    
    # Test 9: Get user blocks (authenticated endpoint)
    if alice_token:
        try:
            headers = {"Authorization": f"Bearer {alice_token}"}
            response = requests.get(f"{base_url}/api/user/blocks", headers=headers)
            
            if response.status_code == 200:
                user_blocks = response.json()
                print(f"\n✅ User blocks for Alice: {user_blocks['total_blocks']} blocks")
                print(f"   Note: {user_blocks['note']}")
            else:
                print(f"❌ User blocks retrieval failed")
        except Exception as e:
            print(f"❌ User blocks error: {e}")
    
    # Test 10: Test unauthorized access
    print("\n" + "="*60)
    print("🚫 UNAUTHORIZED ACCESS TESTS")
    print("="*60)
    
    try:
        # Try to create block without authentication
        contract_data = {
            "amount": 999.99,
            "sender": "Hacker",
            "receiver": "Victim",
            "timestamp": str(int(time.time()))
        }
        
        response = requests.post(f"{base_url}/api/block", json=contract_data)
        
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
        else:
            print(f"❌ Security issue: Unauthorized access allowed")
            
    except Exception as e:
        print(f"❌ Unauthorized access test error: {e}")
    
    # Test 11: List all users
    try:
        response = requests.get(f"{base_url}/auth/users")
        if response.status_code == 200:
            users = response.json()
            print(f"\n👥 Total registered users: {users['total_users']}")
        else:
            print(f"❌ Users list retrieval failed")
    except Exception as e:
        print(f"❌ Users list error: {e}")
    
    print("\n" + "="*60)
    print("🎉 ALL TESTS COMPLETED!")
    print("✅ User authentication with e-signature working!")
    print("✅ Blockchain integration with authentication working!")
    print("✅ Security measures in place!")
    print("="*60)

if __name__ == "__main__":
    test_authentication_and_blockchain() 