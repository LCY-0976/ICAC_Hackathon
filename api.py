from fastapi import FastAPI, Request
import uvicorn
from pydantic import BaseModel
import blockchain
import time

# Create blockchain instance using C++ module
chain = blockchain.Blockchain()

class Contract(BaseModel):
    amount: float
    sender: str
    receiver: str
    timestamp: str

app = FastAPI(title="Blockchain API", description="API for interacting with C++ blockchain")

@app.get("/")
async def read_root():
    return {"message": "Blockchain API is running", "using": "C++ implementation"}

@app.get("/api/data")
async def get_data():
    return {"message": "Hello from FastAPI!", "value": 3.14}

@app.post("/api/block")
async def create_contract(contract: Contract):
    # Convert Contract to TransactionData for C++ module
    transaction_data = blockchain.TransactionData()
    transaction_data.amount = contract.amount
    transaction_data.senderKey = contract.sender
    transaction_data.receiverKey = contract.receiver
    
    # Convert timestamp string to time_t (integer)
    try:
        if contract.timestamp.isdigit():
            transaction_data.timestamp = int(contract.timestamp)
        else:
            transaction_data.timestamp = int(time.time())
    except:
        transaction_data.timestamp = int(time.time())
    
    # Add block to chain
    chain.addBlock(transaction_data)
    
    return {
        "message": "Contract created successfully", 
        "contract": contract,
        "block_index": chain.getChainSize() - 1
    }

@app.get("/api/contract")
async def get_contract():
    return {"message": "Contract retrieved successfully"}

@app.get("/api/block/{index}")
async def get_block(index: int):
    try:
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
        return {"message": "block retrieved successfully", "block": response_data}
    except Exception as e:
        return {"error": f"Block not found: {str(e)}"}

@app.get("/api/blockchain/validate")
async def validate_blockchain():
    is_valid = chain.isChainValid()
    return {
        "message": "Blockchain validation completed",
        "is_valid": is_valid,
        "chain_size": chain.getChainSize()
    }

@app.get("/api/blockchain/info")
async def get_blockchain_info():
    return {
        "message": "Blockchain info",
        "chain_size": chain.getChainSize(),
        "is_valid": chain.isChainValid(),
        "using": "C++ implementation"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
