from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
from pydantic import BaseModel
import blockchain
import time
import json
from user_auth import user_manager, User
from typing import Optional, List, Dict
import uuid

# Create blockchain instance using C++ module
chain = blockchain.Blockchain()

# Storage for pending contracts that need signatures
pending_contracts: Dict[str, Dict] = {}

# Security
security = HTTPBearer()

class UserRegistration(BaseModel):
    user_name: str
    user_id: str
    user_password: str

class UserLogin(BaseModel):
    user_id: str
    user_password: str

class Contract(BaseModel):
    amount: float
    sender: str
    receiver: str
    timestamp: str
    description: Optional[str] = None

class ContractSignature(BaseModel):
    contract_id: str
    e_signature: Optional[str] = None  # Will be automatically filled from authenticated user

app = FastAPI(
    title="Multi-Signature Blockchain API", 
    description="API for blockchain with multi-signature consensus - requires all users to sign contracts"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Authentication dependency
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify the user's e-signature token and return the user object"""
    e_signature = credentials.credentials
    user = user_manager.get_user_by_signature(e_signature)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return user

# === FRONTEND ROUTES ===

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Multi-Signature Blockchain</title>
        <meta http-equiv="refresh" content="0; url=/login">
    </head>
    <body>
        <p>Redirecting to login...</p>
    </body>
    </html>
    """

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    try:
        with open("templates/login.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Login page not found")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page():
    try:
        with open("templates/dashboard.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dashboard page not found")

# === API STATUS ===

@app.get("/api")
async def read_api_root():
    return {
        "message": "Multi-Signature Blockchain API is running", 
        "using": "C++ implementation",
        "features": ["User Authentication", "E-Signature", "Multi-Signature Consensus", "Blockchain"]
    }

# === USER AUTHENTICATION ENDPOINTS ===

@app.post("/auth/register")
async def register_user(user_data: UserRegistration):
    """Register a new user with e-signature generation"""
    try:
        result = user_manager.register_user(
            user_data.user_name, 
            user_data.user_id, 
            user_data.user_password
        )
        
        if result["success"]:
            print(f"🔍 DEBUG - New user registered: {user_data.user_name}")
            print(f"   User ID: {user_data.user_id}")
            print(f"   E-signature: {result['user']['e_signature']}")
            
        return result
    except Exception as e:
        print(f"❌ DEBUG - Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(user_credentials: UserLogin):
    """Login user and return e-signature token"""
    try:
        result = user_manager.login_user(
            user_credentials.user_id, 
            user_credentials.user_password
        )
        
        if result["success"]:
            print(f"🔍 DEBUG - User logged in: {user_credentials.user_id}")
            print(f"   E-signature token: {result['session_token']}")
            
        return result
    except Exception as e:
        print(f"❌ DEBUG - Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/auth/logout")
async def logout_user(current_user: User = Depends(get_current_user)):
    """Logout current user"""
    try:
        result = user_manager.logout_user(current_user.user_id)
        print(f"🔍 DEBUG - User logged out: {current_user.user_id}")
        return result
    except Exception as e:
        print(f"❌ DEBUG - Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")

@app.get("/auth/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile information"""
    return {
        "message": "User profile retrieved",
        "user": current_user.to_dict()
    }

@app.get("/auth/users")
async def get_all_users():
    """Get all registered users (admin endpoint)"""
    users = user_manager.get_all_users()
    return {
        "message": "All users retrieved",
        "total_users": len(users),
        "users": users
    }

# === MULTI-SIGNATURE CONTRACT ENDPOINTS ===

@app.post("/api/contract/create")
async def create_contract(contract: Contract, current_user: User = Depends(get_current_user)):
    """Create a new contract that requires all users to sign before being added to blockchain"""
    try:
        # Generate unique contract ID
        contract_id = str(uuid.uuid4())
        
        # Get all registered users
        all_users = user_manager.get_all_users()
        required_signatures = list(all_users.keys())
        
        print(f"🔍 DEBUG - Creating contract for multi-signature:")
        print(f"   Contract ID: {contract_id}")
        print(f"   Creator: {current_user.user_name}")
        print(f"   Required signatures: {len(required_signatures)} users")
        print(f"   Users: {list(all_users.keys())}")
        
        # Create pending contract
        pending_contract = {
            "contract_id": contract_id,
            "creator": current_user.user_id,
            "creator_name": current_user.user_name,
            "contract_data": {
                "amount": contract.amount,
                "sender": contract.sender,
                "receiver": contract.receiver,
                "timestamp": contract.timestamp,
                "description": contract.description or f"Transaction from {contract.sender} to {contract.receiver}"
            },
            "required_signatures": required_signatures,
            "signatures": {},  # user_id -> e_signature
            "status": "pending",
            "created_at": time.time()
        }
        
        # Automatically add creator's signature
        pending_contract["signatures"][current_user.user_id] = current_user.e_signature
        
        # Store pending contract
        pending_contracts[contract_id] = pending_contract
        
        print(f"✅ DEBUG - Contract created with ID: {contract_id}")
        print(f"   Signatures: 1/{len(required_signatures)} (creator signed automatically)")
        
        return {
            "message": "Contract created successfully and requires all user signatures",
            "contract_id": contract_id,
            "contract": pending_contract["contract_data"],
            "signatures_required": len(required_signatures),
            "signatures_received": 1,
            "signed_by": [current_user.user_name],
            "status": "pending",
            "next_step": f"Share contract ID {contract_id} with other users to collect signatures"
        }
        
    except Exception as e:
        print(f"❌ DEBUG - Error creating contract: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create contract: {str(e)}")

@app.post("/api/contract/sign")
async def sign_contract(signature_request: ContractSignature, current_user: User = Depends(get_current_user)):
    """Sign a pending contract with user's e-signature"""
    try:
        contract_id = signature_request.contract_id
        
        if contract_id not in pending_contracts:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        pending_contract = pending_contracts[contract_id]
        
        # Check if user already signed
        if current_user.user_id in pending_contract["signatures"]:
            return {
                "message": "User has already signed this contract",
                "contract_id": contract_id,
                "status": "already_signed"
            }
        
        # Check if user is required to sign
        if current_user.user_id not in pending_contract["required_signatures"]:
            raise HTTPException(status_code=403, detail="User not authorized to sign this contract")
        
        # Add user's signature
        pending_contract["signatures"][current_user.user_id] = current_user.e_signature
        
        signatures_count = len(pending_contract["signatures"])
        required_count = len(pending_contract["required_signatures"])
        
        print(f"🔍 DEBUG - Contract signed:")
        print(f"   Contract ID: {contract_id}")
        print(f"   Signer: {current_user.user_name}")
        print(f"   Signatures: {signatures_count}/{required_count}")
        
        # Check if all signatures collected
        if signatures_count == required_count:
            # All signatures collected - add to blockchain
            print(f"✅ DEBUG - All signatures collected! Adding to blockchain...")
            
            contract_data = pending_contract["contract_data"]
            
            # Convert to TransactionData for C++ module
            transaction_data = blockchain.TransactionData()
            transaction_data.amount = contract_data["amount"]
            transaction_data.senderKey = contract_data["sender"]
            transaction_data.receiverKey = contract_data["receiver"]
            
            # Convert timestamp
            try:
                if contract_data["timestamp"].isdigit():
                    transaction_data.timestamp = int(contract_data["timestamp"])
                else:
                    transaction_data.timestamp = int(time.time())
            except:
                transaction_data.timestamp = int(time.time())
            
            # Add block to blockchain
            chain.addBlock(transaction_data)
            
            # Update contract status
            pending_contract["status"] = "completed"
            pending_contract["block_index"] = chain.getChainSize() - 1
            pending_contract["completed_at"] = time.time()
            
            # Get signer names
            signer_names = []
            for user_id in pending_contract["signatures"].keys():
                user_info = user_manager.users.get(user_id)
                if user_info:
                    signer_names.append(user_info.user_name)
            
            print(f"✅ DEBUG - Contract {contract_id} added to blockchain at index {pending_contract['block_index']}")
            
            return {
                "message": "Contract fully signed and added to blockchain!",
                "contract_id": contract_id,
                "status": "completed",
                "block_index": pending_contract["block_index"],
                "signatures_received": signatures_count,
                "signed_by": signer_names,
                "blockchain_size": chain.getChainSize(),
                "blockchain_valid": chain.isChainValid()
            }
        else:
            # Still need more signatures
            remaining_users = []
            for user_id in pending_contract["required_signatures"]:
                if user_id not in pending_contract["signatures"]:
                    user_info = user_manager.users.get(user_id)
                    if user_info:
                        remaining_users.append(user_info.user_name)
            
            return {
                "message": f"Contract signed by {current_user.user_name}. Waiting for more signatures.",
                "contract_id": contract_id,
                "status": "pending",
                "signatures_received": signatures_count,
                "signatures_required": required_count,
                "waiting_for": remaining_users
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DEBUG - Error signing contract: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to sign contract: {str(e)}")

@app.get("/api/contract/{contract_id}")
async def get_contract_status(contract_id: str):
    """Get the status of a contract and its signatures"""
    try:
        if contract_id not in pending_contracts:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract = pending_contracts[contract_id]
        
        # Get signer information
        signers = []
        for user_id, signature in contract["signatures"].items():
            user_info = user_manager.users.get(user_id)
            if user_info:
                signers.append({
                    "user_id": user_id,
                    "user_name": user_info.user_name,
                    "signature": signature[:20] + "...",  # Show partial signature
                    "signed_at": "timestamp_here"  # Could add timestamps
                })
        
        # Get pending signers
        pending_signers = []
        for user_id in contract["required_signatures"]:
            if user_id not in contract["signatures"]:
                user_info = user_manager.users.get(user_id)
                if user_info:
                    pending_signers.append({
                        "user_id": user_id,
                        "user_name": user_info.user_name
                    })
        
        return {
            "contract_id": contract_id,
            "status": contract["status"],
            "contract_data": contract["contract_data"],
            "creator": contract["creator_name"],
            "signatures_received": len(contract["signatures"]),
            "signatures_required": len(contract["required_signatures"]),
            "signers": signers,
            "pending_signers": pending_signers,
            "block_index": contract.get("block_index"),
            "created_at": contract["created_at"],
            "completed_at": contract.get("completed_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DEBUG - Error getting contract status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get contract status: {str(e)}")

@app.get("/api/contracts/pending")
async def get_pending_contracts(current_user: User = Depends(get_current_user)):
    """Get all contracts pending the current user's signature"""
    try:
        user_pending_contracts = []
        
        for contract_id, contract in pending_contracts.items():
            # Check if user needs to sign and hasn't signed yet
            if (current_user.user_id in contract["required_signatures"] and 
                current_user.user_id not in contract["signatures"] and
                contract["status"] == "pending"):
                
                user_pending_contracts.append({
                    "contract_id": contract_id,
                    "contract_data": contract["contract_data"],
                    "creator": contract["creator_name"],
                    "signatures_received": len(contract["signatures"]),
                    "signatures_required": len(contract["required_signatures"]),
                    "created_at": contract["created_at"]
                })
        
        return {
            "message": f"Pending contracts for {current_user.user_name}",
            "user": current_user.user_name,
            "pending_contracts": user_pending_contracts,
            "count": len(user_pending_contracts)
        }
        
    except Exception as e:
        print(f"❌ DEBUG - Error getting pending contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get pending contracts: {str(e)}")

@app.get("/api/contracts/all")
async def get_all_contracts():
    """Get all contracts (pending and completed)"""
    try:
        all_contracts = []
        
        for contract_id, contract in pending_contracts.items():
            # Get signer names
            signer_names = []
            for user_id in contract["signatures"].keys():
                user_info = user_manager.users.get(user_id)
                if user_info:
                    signer_names.append(user_info.user_name)
            
            all_contracts.append({
                "contract_id": contract_id,
                "status": contract["status"],
                "contract_data": contract["contract_data"],
                "creator": contract["creator_name"],
                "signatures_received": len(contract["signatures"]),
                "signatures_required": len(contract["required_signatures"]),
                "signed_by": signer_names,
                "block_index": contract.get("block_index"),
                "created_at": contract["created_at"],
                "completed_at": contract.get("completed_at")
            })
        
        return {
            "message": "All contracts retrieved",
            "total_contracts": len(all_contracts),
            "contracts": all_contracts
        }
        
    except Exception as e:
        print(f"❌ DEBUG - Error getting all contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get all contracts: {str(e)}")

# === LEGACY BLOCKCHAIN ENDPOINTS (for backward compatibility) ===

@app.get("/api/data")
async def get_data():
    return {"message": "Hello from Multi-Signature FastAPI!", "value": 3.14}

@app.get("/api/block/{index}")
async def get_block(index: int):
    try:
        print(f"🔍 DEBUG - Getting block {index}")
        block = chain.getBlock(index)
        block_data = block.getData()
        
        response_data = {
            "index": block.getIndex(),
            "hash": block.getHash(),
            "previousHash": block.getPreviousHash(),
            "data": {
                "amount": block_data.amount,
                "senderKey": block_data.senderKey,
                "receiverKey": block_data.receiverKey,
                "timestamp": block_data.timestamp
            }
        }
        print(f"✅ DEBUG - Block {index} retrieved successfully")
        return {"message": "block retrieved successfully", "block": response_data}
    except Exception as e:
        print(f"❌ DEBUG - Error getting block {index}: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Block not found: {str(e)}")

@app.get("/api/blockchain/validate")
async def validate_blockchain():
    try:
        print(f"🔍 DEBUG - Validating blockchain...")
        is_valid = chain.isChainValid()
        chain_size = chain.getChainSize()
        print(f"✅ DEBUG - Validation complete: valid={is_valid}, size={chain_size}")
        return {
            "message": "Blockchain validation completed",
            "is_valid": is_valid,
            "chain_size": chain_size
        }
    except Exception as e:
        print(f"❌ DEBUG - Error validating blockchain: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.get("/api/blockchain/info")
async def get_blockchain_info():
    try:
        print(f"🔍 DEBUG - Getting blockchain info...")
        chain_size = chain.getChainSize()
        is_valid = chain.isChainValid()
        total_users = len(user_manager.users)
        pending_contracts_count = len([c for c in pending_contracts.values() if c["status"] == "pending"])
        completed_contracts_count = len([c for c in pending_contracts.values() if c["status"] == "completed"])
        
        print(f"✅ DEBUG - Info retrieved: size={chain_size}, valid={is_valid}")
        return {
            "message": "Multi-signature blockchain info",
            "chain_size": chain_size,
            "is_valid": is_valid,
            "using": "C++ implementation",
            "features": ["Multi-Signature Consensus", "User Authentication", "E-Signature Integration"],
            "consensus_info": {
                "total_users": total_users,
                "pending_contracts": pending_contracts_count,
                "completed_contracts": completed_contracts_count,
                "consensus_requirement": "All users must sign"
            }
        }
    except Exception as e:
        print(f"❌ DEBUG - Error getting blockchain info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Info retrieval failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
