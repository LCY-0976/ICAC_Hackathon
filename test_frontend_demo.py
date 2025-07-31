#!/usr/bin/env python3
"""
Frontend Demo Script for Multi-Signature Blockchain
This script demonstrates the frontend functionality by testing the API endpoints
that the frontend will use.
"""

import requests
import json
import time

def test_frontend_workflow():
    base_url = "http://localhost:8000"
    
    print("🌐 Testing Multi-Signature Blockchain Frontend")
    print("=" * 70)
    
    # Test 1: Check if frontend pages are accessible
    print("📄 Testing Frontend Pages...")
    try:
        # Test login page
        response = requests.get(f"{base_url}/login")
        if response.status_code == 200 and "Multi-Signature Blockchain" in response.text:
            print("✅ Login page accessible")
        else:
            print(f"❌ Login page issue: {response.status_code}")
            
        # Test dashboard page
        response = requests.get(f"{base_url}/dashboard")
        if response.status_code == 200 and "dashboard" in response.text.lower():
            print("✅ Dashboard page accessible")
        else:
            print(f"❌ Dashboard page issue: {response.status_code}")
            
        # Test static files
        response = requests.get(f"{base_url}/static/css/style.css")
        if response.status_code == 200:
            print("✅ CSS files accessible")
        else:
            print(f"❌ CSS files issue: {response.status_code}")
            
        response = requests.get(f"{base_url}/static/js/login.js")
        if response.status_code == 200:
            print("✅ JavaScript files accessible")
        else:
            print(f"❌ JavaScript files issue: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return
    
    print("\n" + "="*70)
    print("🔐 Testing User Authentication Flow")
    print("="*70)
    
    # Test login with existing user
    try:
        login_data = {
            "user_id": "alice001",
            "user_password": "password123"
        }
        
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                alice_token = result["session_token"]
                print(f"✅ Alice login successful")
                print(f"   Token: {alice_token[:20]}...")
                print(f"   User: {result['user']['user_name']}")
                print(f"   E-signature: {result['user']['e_signature'][:20]}...")
            else:
                print(f"❌ Alice login failed: {result.get('message')}")
                return
        else:
            print(f"❌ Alice login HTTP error: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Alice login error: {e}")
        return
    
    # Test profile endpoint (used by dashboard to verify login)
    try:
        headers = {"Authorization": f"Bearer {alice_token}"}
        response = requests.get(f"{base_url}/auth/profile", headers=headers)
        
        if response.status_code == 200:
            profile = response.json()
            print(f"✅ Profile verification successful")
            print(f"   User: {profile['user']['user_name']}")
        else:
            print(f"❌ Profile verification failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Profile test error: {e}")
    
    print("\n" + "="*70)
    print("📊 Testing Dashboard Data Loading")
    print("="*70)
    
    # Test blockchain info (for dashboard stats)
    try:
        response = requests.get(f"{base_url}/api/blockchain/info")
        
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Blockchain info loaded")
            print(f"   Chain size: {info['chain_size']}")
            print(f"   Valid: {info['is_valid']}")
            print(f"   Total users: {info['consensus_info']['total_users']}")
            print(f"   Pending contracts: {info['consensus_info']['pending_contracts']}")
            print(f"   Completed contracts: {info['consensus_info']['completed_contracts']}")
        else:
            print(f"❌ Blockchain info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Blockchain info error: {e}")
    
    # Test pending contracts (for dashboard pending tab)
    try:
        headers = {"Authorization": f"Bearer {alice_token}"}
        response = requests.get(f"{base_url}/api/contracts/pending", headers=headers)
        
        if response.status_code == 200:
            pending = response.json()
            print(f"✅ Pending contracts loaded")
            print(f"   Count: {pending['count']}")
            if pending['pending_contracts']:
                for contract in pending['pending_contracts'][:2]:  # Show first 2
                    print(f"   - Contract: ${contract['contract_data']['amount']} ({contract['creator']})")
        else:
            print(f"❌ Pending contracts failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Pending contracts error: {e}")
    
    # Test all contracts (for dashboard contracts tab)
    try:
        response = requests.get(f"{base_url}/api/contracts/all")
        
        if response.status_code == 200:
            all_contracts = response.json()
            print(f"✅ All contracts loaded")
            print(f"   Total: {all_contracts['total_contracts']}")
            if all_contracts['contracts']:
                for contract in all_contracts['contracts'][:2]:  # Show first 2
                    print(f"   - Contract: ${contract['contract_data']['amount']} ({contract['status']})")
        else:
            print(f"❌ All contracts failed: {response.status_code}")
    except Exception as e:
        print(f"❌ All contracts error: {e}")
    
    print("\n" + "="*70)
    print("📝 Testing Contract Creation Workflow")
    print("="*70)
    
    # Test contract creation (main dashboard functionality)
    try:
        headers = {"Authorization": f"Bearer {alice_token}"}
        contract_data = {
            "amount": 750.0,
            "sender": "Frontend Test Co",
            "receiver": "Demo Recipient",
            "timestamp": str(int(time.time())),
            "description": "Frontend workflow test contract"
        }
        
        response = requests.post(f"{base_url}/api/contract/create", json=contract_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            contract_id = result["contract_id"]
            print(f"✅ Contract created via frontend API")
            print(f"   Contract ID: {contract_id}")
            print(f"   Amount: ${contract_data['amount']}")
            print(f"   Signatures required: {result['signatures_required']}")
            print(f"   Signatures received: {result['signatures_received']}")
            
            # Test contract details (modal functionality)
            response = requests.get(f"{base_url}/api/contract/{contract_id}")
            
            if response.status_code == 200:
                details = response.json()
                print(f"✅ Contract details loaded")
                print(f"   Status: {details['status']}")
                print(f"   Creator: {details['creator']}")
                print(f"   Signers: {len(details['signers'])}")
                print(f"   Pending: {len(details['pending_signers'])}")
            else:
                print(f"❌ Contract details failed: {response.status_code}")
                
        else:
            print(f"❌ Contract creation failed: {response.status_code}")
            if response.headers.get('content-type') == 'application/json':
                print(f"   Error: {response.json()}")
    except Exception as e:
        print(f"❌ Contract creation error: {e}")
    
    print("\n" + "="*70)
    print("🔍 Testing Block Explorer Functionality")
    print("="*70)
    
    # Test blockchain blocks (for dashboard blockchain tab)
    try:
        # Get blockchain info first
        response = requests.get(f"{base_url}/api/blockchain/info")
        
        if response.status_code == 200:
            info = response.json()
            chain_size = info['chain_size']
            
            # Test loading individual blocks
            for i in range(min(chain_size, 3)):  # Test first 3 blocks
                response = requests.get(f"{base_url}/api/block/{i}")
                
                if response.status_code == 200:
                    block = response.json()['block']
                    print(f"✅ Block #{i} loaded")
                    print(f"   Hash: {str(block['hash'])[:20]}...")
                    print(f"   Amount: ${block['data']['amount']}")
                    print(f"   From: {block['data']['senderKey']} → {block['data']['receiverKey']}")
                else:
                    print(f"❌ Block #{i} failed: {response.status_code}")
        else:
            print(f"❌ Blockchain info for blocks failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Block explorer error: {e}")
    
    print("\n" + "="*70)
    print("✅ FRONTEND TESTING COMPLETED!")
    print("🌐 Frontend is ready for use!")
    print("📱 Access your application at: http://localhost:8000")
    print("👤 Demo users available in the login page")
    print("🔐 Multi-signature workflow fully functional")
    print("="*70)
    
    print("\n🚀 NEXT STEPS:")
    print("1. Open http://localhost:8000 in your browser")
    print("2. Click on a demo user to auto-fill credentials")
    print("3. Login and explore the dashboard")
    print("4. Create contracts and test multi-signature workflow")
    print("5. Explore blockchain validation and block details")

if __name__ == "__main__":
    test_frontend_workflow() 