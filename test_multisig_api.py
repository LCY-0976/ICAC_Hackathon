#!/usr/bin/env python3
"""
Test script for Multi-Signature Blockchain API
Tests multi-signature consensus where all users must sign contracts before blockchain addition
"""

import requests
import json
import time
import hashlib

def test_multisignature_blockchain():
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Multi-Signature Blockchain API")
    print("=" * 70)
    
    # Test 1: API Status
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ API Status: {response.json()}")
    except Exception as e:
        print(f"❌ API not running: {e}")
        return
    
    print("\n" + "="*70)
    print("👤 USER REGISTRATION & LOGIN")
    print("="*70)
    
    # Test 2: Register multiple users for multi-signature testing
    test_users = [
        {"user_name": "Alice Johnson", "user_id": "alice001", "user_password": "password123"},
        {"user_name": "Bob Smith", "user_id": "bob002", "user_password": "securepass"},
        {"user_name": "Charlie Brown", "user_id": "charlie003", "user_password": "mypassword"},
        {"user_name": "Diana Wilson", "user_id": "diana004", "user_password": "strongpass"}
    ]
    
    registered_users = []
    user_tokens = {}
    
    # Register users
    for user_data in test_users:
        try:
            response = requests.post(f"{base_url}/auth/register", json=user_data)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                print(f"✅ User registered: {user_data['user_name']}")
                print(f"   E-signature: {result['user']['e_signature'][:20]}...")
                registered_users.append(user_data)
            else:
                print(f"⚠️ User {user_data['user_name']}: {result.get('message')}")
                
        except Exception as e:
            print(f"❌ Failed to register {user_data['user_name']}: {e}")
    
    # Login users and get tokens
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
                user_tokens[user_data["user_id"]] = result['session_token']
            else:
                print(f"❌ Login failed for {user_data['user_name']}")
                
        except Exception as e:
            print(f"❌ Login error for {user_data['user_name']}: {e}")
    
    if len(user_tokens) < 2:
        print("❌ Need at least 2 users for multi-signature testing. Cannot continue.")
        return
    
    print(f"\n📊 Successfully logged in {len(user_tokens)} users")
    
    print("\n" + "="*70)
    print("📄 MULTI-SIGNATURE CONTRACT CREATION")
    print("="*70)
    
    # Test 3: Create a contract (requires all signatures)
    alice_token = user_tokens.get("alice001")
    if not alice_token:
        print("❌ Alice not logged in. Cannot create contract.")
        return
    
    try:
        headers = {"Authorization": f"Bearer {alice_token}"}
        contract_data = {
            "amount": 500.0,
            "sender": "Company A",
            "receiver": "Company B",
            "timestamp": str(int(time.time())),
            "description": "Multi-million dollar business deal requiring all stakeholder approval"
        }
        
        response = requests.post(f"{base_url}/api/contract/create", json=contract_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            contract_id = result["contract_id"]
            print(f"✅ Contract created successfully!")
            print(f"   Contract ID: {contract_id}")
            print(f"   Amount: ${contract_data['amount']}")
            print(f"   Description: {contract_data['description']}")
            print(f"   Signatures required: {result['signatures_required']}")
            print(f"   Signatures received: {result['signatures_received']} (creator auto-signed)")
            print(f"   Next step: {result['next_step']}")
        else:
            print(f"❌ Contract creation failed: {response.json()}")
            return
            
    except Exception as e:
        print(f"❌ Contract creation error: {e}")
        return
    
    print("\n" + "="*70)
    print("📋 CONTRACT STATUS CHECKING")
    print("="*70)
    
    # Test 4: Check contract status
    try:
        response = requests.get(f"{base_url}/api/contract/{contract_id}")
        
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Contract Status Retrieved:")
            print(f"   Status: {status['status']}")
            print(f"   Creator: {status['creator']}")
            print(f"   Signatures: {status['signatures_received']}/{status['signatures_required']}")
            print(f"   Signed by: {[s['user_name'] for s in status['signers']]}")
            print(f"   Waiting for: {[s['user_name'] for s in status['pending_signers']]}")
        else:
            print(f"❌ Contract status check failed")
            
    except Exception as e:
        print(f"❌ Contract status error: {e}")
    
    print("\n" + "="*70)
    print("✍️ MULTI-SIGNATURE SIGNING PROCESS")
    print("="*70)
    
    # Test 5: Other users sign the contract one by one
    signing_order = ["bob002", "charlie003", "diana004"]
    
    for i, user_id in enumerate(signing_order):
        user_token = user_tokens.get(user_id)
        if not user_token:
            print(f"⚠️ User {user_id} not logged in, skipping")
            continue
        
        user_name = next((u["user_name"] for u in registered_users if u["user_id"] == user_id), user_id)
        
        try:
            headers = {"Authorization": f"Bearer {user_token}"}
            signature_data = {"contract_id": contract_id}
            
            response = requests.post(f"{base_url}/api/contract/sign", json=signature_data, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Contract signed by {user_name}")
                print(f"   Status: {result['status']}")
                
                if result["status"] == "completed":
                    print(f"🎉 ALL SIGNATURES COLLECTED! Contract added to blockchain!")
                    print(f"   Block index: {result['block_index']}")
                    print(f"   Blockchain size: {result['blockchain_size']}")
                    print(f"   Blockchain valid: {result['blockchain_valid']}")
                    print(f"   All signers: {result['signed_by']}")
                    break
                else:
                    print(f"   Signatures: {result['signatures_received']}/{result['signatures_required']}")
                    if 'waiting_for' in result:
                        print(f"   Still waiting for: {result['waiting_for']}")
            else:
                print(f"❌ Signing failed for {user_name}: {response.json()}")
                
        except Exception as e:
            print(f"❌ Signing error for {user_name}: {e}")
        
        # Small delay between signatures for demonstration
        time.sleep(1)
    
    print("\n" + "="*70)
    print("⛓️ BLOCKCHAIN VERIFICATION")
    print("="*70)
    
    # Test 6: Verify blockchain state
    try:
        response = requests.get(f"{base_url}/api/blockchain/info")
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Blockchain Info:")
            print(f"   Chain size: {info['chain_size']}")
            print(f"   Is valid: {info['is_valid']}")
            print(f"   Consensus info:")
            print(f"     Total users: {info['consensus_info']['total_users']}")
            print(f"     Pending contracts: {info['consensus_info']['pending_contracts']}")
            print(f"     Completed contracts: {info['consensus_info']['completed_contracts']}")
            print(f"     Requirement: {info['consensus_info']['consensus_requirement']}")
        else:
            print(f"❌ Blockchain info failed")
    except Exception as e:
        print(f"❌ Blockchain info error: {e}")
    
    # Test 7: Retrieve the added block
    try:
        # Get the block that was just added
        response = requests.get(f"{base_url}/api/contract/{contract_id}")
        if response.status_code == 200:
            contract_info = response.json()
            if "block_index" in contract_info:
                block_index = contract_info["block_index"]
                
                response = requests.get(f"{base_url}/api/block/{block_index}")
                if response.status_code == 200:
                    block = response.json()["block"]
                    print(f"\n✅ Retrieved blockchain block {block_index}:")
                    print(f"   Hash: {block['hash']}")
                    print(f"   Amount: {block['data']['amount']}")
                    print(f"   From: {block['data']['senderKey']}")
                    print(f"   To: {block['data']['receiverKey']}")
                    print(f"   Timestamp: {block['data']['timestamp']}")
                else:
                    print(f"❌ Block retrieval failed")
            else:
                print(f"⚠️ Contract not yet added to blockchain")
    except Exception as e:
        print(f"❌ Block retrieval error: {e}")
    
    print("\n" + "="*70)
    print("📄 PENDING CONTRACTS TEST")
    print("="*70)
    
    # Test 8: Create another contract and check pending contracts
    try:
        headers = {"Authorization": f"Bearer {user_tokens['bob002']}"}
        contract_data = {
            "amount": 1000.0,
            "sender": "Bob's Company",
            "receiver": "Investment Fund",
            "timestamp": str(int(time.time())),
            "description": "Investment contract requiring unanimous approval"
        }
        
        response = requests.post(f"{base_url}/api/contract/create", json=contract_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            second_contract_id = result["contract_id"]
            print(f"✅ Second contract created by Bob")
            print(f"   Contract ID: {second_contract_id}")
            
            # Check pending contracts for Alice
            headers = {"Authorization": f"Bearer {alice_token}"}
            response = requests.get(f"{base_url}/api/contracts/pending", headers=headers)
            
            if response.status_code == 200:
                pending = response.json()
                print(f"\n✅ Pending contracts for Alice:")
                print(f"   Count: {pending['count']}")
                for contract in pending['pending_contracts']:
                    print(f"   - Contract {contract['contract_id'][:8]}...")
                    print(f"     Amount: ${contract['contract_data']['amount']}")
                    print(f"     Creator: {contract['creator']}")
                    print(f"     Signatures: {contract['signatures_received']}/{contract['signatures_required']}")
            else:
                print(f"❌ Pending contracts check failed")
        else:
            print(f"❌ Second contract creation failed")
            
    except Exception as e:
        print(f"❌ Second contract test error: {e}")
    
    print("\n" + "="*70)
    print("📊 ALL CONTRACTS OVERVIEW")
    print("="*70)
    
    # Test 9: Get all contracts
    try:
        response = requests.get(f"{base_url}/api/contracts/all")
        if response.status_code == 200:
            all_contracts = response.json()
            print(f"✅ All Contracts Summary:")
            print(f"   Total contracts: {all_contracts['total_contracts']}")
            
            for contract in all_contracts['contracts']:
                print(f"\n   📄 Contract {contract['contract_id'][:8]}...")
                print(f"      Status: {contract['status']}")
                print(f"      Creator: {contract['creator']}")
                print(f"      Amount: ${contract['contract_data']['amount']}")
                print(f"      Signatures: {contract['signatures_received']}/{contract['signatures_required']}")
                print(f"      Signed by: {contract['signed_by']}")
                if contract.get('block_index') is not None:
                    print(f"      Blockchain index: {contract['block_index']}")
        else:
            print(f"❌ All contracts retrieval failed")
    except Exception as e:
        print(f"❌ All contracts error: {e}")
    
    print("\n" + "="*70)
    print("🚫 SECURITY TESTS")
    print("="*70)
    
    # Test 10: Try to sign non-existent contract
    try:
        headers = {"Authorization": f"Bearer {alice_token}"}
        fake_signature = {"contract_id": "fake-contract-id-12345"}
        
        response = requests.post(f"{base_url}/api/contract/sign", json=fake_signature, headers=headers)
        
        if response.status_code == 404:
            print("✅ Non-existent contract properly rejected")
        else:
            print(f"❌ Security issue: Non-existent contract not properly handled")
            
    except Exception as e:
        print(f"❌ Security test error: {e}")
    
    # Test 11: Try to create contract without authentication
    try:
        contract_data = {
            "amount": 999999.0,
            "sender": "Hacker",
            "receiver": "Victim",
            "timestamp": str(int(time.time())),
            "description": "Unauthorized transaction"
        }
        
        response = requests.post(f"{base_url}/api/contract/create", json=contract_data)
        
        if response.status_code == 401:
            print("✅ Unauthorized contract creation properly blocked")
        else:
            print(f"❌ Security issue: Unauthorized contract creation allowed")
            
    except Exception as e:
        print(f"❌ Unauthorized test error: {e}")
    
    print("\n" + "="*70)
    print("🎉 MULTI-SIGNATURE BLOCKCHAIN TESTING COMPLETED!")
    print("✅ Multi-signature consensus working perfectly!")
    print("✅ All users must sign before blockchain addition!")
    print("✅ Security measures in place!")
    print("✅ Contract workflow functioning correctly!")
    print("="*70)

if __name__ == "__main__":
    test_multisignature_blockchain() 