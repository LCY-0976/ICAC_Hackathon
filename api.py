from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from pydantic import BaseModel
import blockchain
import time
import json
import os
from datetime import datetime, timedelta
import jwt
import hashlib
from typing import Optional, Dict, List
import asyncio
import aiohttp

# JWT Configuration
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_TIME = timedelta(hours=24)

# Create blockchain instance using C++ module
chain = blockchain.Blockchain()

# Security
security = HTTPBearer()

# In-memory storage for demo (replace with database in production)
users_db: Dict[str, Dict] = {}
companies_db: List[str] = ["ABC Company", "XYZ Corporation", "Tech Solutions Inc", "ICAC"]
contracts_db: Dict[str, Dict] = {}  # Store pending contracts
contract_counter = 1

# Authentication Models
class UserRegister(BaseModel):
    user_name: str
    user_id: str
    user_password: str
    company: str

class UserLogin(BaseModel):
    user_id: str
    user_password: str

class User(BaseModel):
    user_name: str
    user_id: str
    company: str
    e_signature: str
    created_at: str
    last_login: str

class Contract(BaseModel):
    amount: float
    sender: str
    receiver: str
    timestamp: str

# Contract Management Models
class ContractUpload(BaseModel):
    contract_title: str
    contract_content: str
    contract_amount: float
    contract_type: str  # "internal" or "cross-company"
    other_company: Optional[str] = None
    uploader: str
    timestamp: str

class PendingContract(BaseModel):
    contract_id: str
    contract_title: str
    contract_content: str
    contract_amount: float
    contract_type: str
    uploader_company: str
    other_company: Optional[str] = None
    uploader: str
    company_signatures: Dict[str, List[str]]
    created_at: str
    status: str
    blockchain_index: Optional[int] = None

# Corruption Analysis Models
class CorruptionAnalysisRequest(BaseModel):
    contract_id: str
    use_lightrag: bool = True
    lightrag_api_url: str = "http://localhost:9621"

class WordAnalysisRequest(BaseModel):
    contract_id: str
    analysis_type: str = "sensitive_word_detection"  # Only sensitive word detection
    use_lightrag: bool = True
    lightrag_api_url: str = "http://localhost:9621"

class CorruptionAnalysisResult(BaseModel):
    contract_id: str
    corruption_risk_level: str
    risk_score: int
    corruption_indicators: List[str]
    red_flags: List[str]
    recommendations: List[str]
    analysis_details: str
    analysis_timestamp: str

class CorruptionAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis_type: str  # 'lightrag_advanced' or 'enhanced_rules'
    contract_id: str
    lightrag_analysis: Optional[CorruptionAnalysisResult] = None
    fallback_analysis: Optional[CorruptionAnalysisResult] = None

class WordAnalysisResult(BaseModel):
    text_content: str
    analysis_type: str
    corruption_risk_level: str
    risk_score: int
    key_findings: List[str]
    risk_indicators: List[str]
    red_flags: List[str]
    recommendations: List[str]
    analysis_details: str
    analysis_timestamp: str

class WordAnalysisResponse(BaseModel):
    success: bool
    message: str
    analysis_type: str  # 'lightrag_advanced' or 'enhanced_rules'
    word_analysis: Optional[WordAnalysisResult] = None

class BatchCorruptionAnalysis(BaseModel):
    success: bool
    message: str
    summary: Dict
    detailed_results: List[Dict]
    high_risk_contracts: List[Dict]

app = FastAPI(
    title="Replica API", 
    description="Contract Management Platform API with Blockchain Technology",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware to monitor performance
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 5.0:  # Log requests taking more than 5 seconds
        print(f"SLOW REQUEST: {request.method} {request.url} took {process_time:.2f}s")
    elif process_time > 1.0:  # Log requests taking more than 1 second
        print(f"Slow request: {request.method} {request.url} took {process_time:.2f}s")
    
    return response

# Authentication Helper Functions
def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

# Corruption Analysis Helper Functions
async def call_lightrag_api_for_text(lightrag_url: str, text_content: str, query: str) -> Optional[str]:
    """Call LightRAG API for word-based text analysis"""
    try:
        # Insert the text as a document
        insert_url = f"{lightrag_url}/documents/text"
        document_text = f"Text Analysis Content:\n{text_content}"

        insert_payload = {
            "text": document_text,
            "file_source": f"word_analysis_{int(time.time())}"
        }

        async with aiohttp.ClientSession() as session:
            # Insert document
            async with session.post(insert_url, json=insert_payload) as response:
                if response.status != 200:
                    print(f"Failed to insert document: {response.status}")
                    return None

            # Wait a bit for processing
            await asyncio.sleep(2)

            # Query the knowledge graph
            query_url = f"{lightrag_url}/query"
            query_payload = {
                "query": query,
                "mode": "hybrid",
                "response_type": "Single Paragraph"
            }

            async with session.post(query_url, json=query_payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("response", "")
                else:
                    print(f"Failed to query LightRAG: {response.status}")
                    return None

    except Exception as e:
        print(f"Error calling LightRAG API: {str(e)}")
        return None

async def call_lightrag_api(lightrag_url: str, contract_data: Dict, query: str) -> Optional[str]:
    """Call LightRAG API for corruption analysis"""
    try:
        # First, insert the contract as a document
        insert_url = f"{lightrag_url}/documents/text"
        document_text = f"""Contract Title: {contract_data['contract_title']}
Contract ID: {contract_data['contract_id']}
Contract Amount: ${contract_data['contract_amount']:,.2f}
Contract Type: {contract_data['contract_type']}
Uploader Company: {contract_data['uploader_company']}
Other Company: {contract_data.get('other_company', 'N/A')}
Contract Content: {contract_data['contract_content']}
Created At: {contract_data['created_at']}
Status: {contract_data['status']}"""

        insert_payload = {
            "text": document_text,
            "file_source": f"contract_{contract_data['contract_id']}"
        }

        async with aiohttp.ClientSession() as session:
            # Insert document
            async with session.post(insert_url, json=insert_payload) as response:
                if response.status != 200:
                    print(f"Failed to insert document: {response.status}")
                    return None

            # Wait a bit for processing
            await asyncio.sleep(2)

            # Query the knowledge graph
            query_url = f"{lightrag_url}/query"
            query_payload = {
                "query": query,
                "mode": "hybrid",
                "response_type": "Single Paragraph"
            }

            async with session.post(query_url, json=query_payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("response", "")
                else:
                    print(f"Failed to query LightRAG: {response.status}")
                    return None

    except Exception as e:
        print(f"Error calling LightRAG API: {str(e)}")
        return None


def parse_word_analysis_response(response_text: str, text_content: str, analysis_type: str) -> WordAnalysisResult:
    """Parse LightRAG response for word-based analysis"""
    try:
        # Extract risk level from response
        risk_level = "Medium"  # Default
        risk_score = 50  # Default
        
        response_lower = response_text.lower()
        
        # Risk level detection
        if any(word in response_lower for word in ['critical', 'very high', 'extremely high']):
            risk_level = "Critical"
            risk_score = 85
        elif any(word in response_lower for word in ['high risk', 'high', 'severe']):
            risk_level = "High"
            risk_score = 75
        elif any(word in response_lower for word in ['medium', 'moderate', 'moderate risk']):
            risk_level = "Medium"
            risk_score = 50
        elif any(word in response_lower for word in ['low', 'minimal', 'low risk']):
            risk_level = "Low"
            risk_score = 25
        
        # Extract findings and indicators from response
        key_findings = []
        risk_indicators = []
        red_flags = []
        recommendations = []
        
        # Pattern extraction for demo
        if 'suspicious' in response_lower:
            risk_indicators.append("Suspicious language patterns detected")
        if 'conflict of interest' in response_lower:
            red_flags.append("Potential conflict of interest language")
        if 'review' in response_lower:
            recommendations.append("Additional review recommended")
        if 'monitor' in response_lower:
            recommendations.append("Enhanced monitoring suggested")
        if 'irregular' in response_lower:
            key_findings.append("Irregular patterns in text structure")
        if 'compliance' in response_lower:
            key_findings.append("Compliance-related content identified")
            
        # Default content for sensitive word detection
        if not key_findings:
            key_findings = ["Sensitive word detection analysis completed"]
                
        if not recommendations:
            recommendations = [
                "AI-powered analysis suggests standard monitoring procedures",
                "Regular compliance checks recommended",
                "Documentation of all relevant activities advised"
            ]
        
        analysis_details = f"""LightRAG AI-Powered Word Analysis Report
        
Analysis Type: {analysis_type.replace('_', ' ').title()}
Risk Assessment: {risk_level} ({risk_score}/100)

AI Analysis Summary:
{response_text}

Analysis Methodology:
This word-based analysis was performed using LightRAG's knowledge graph technology,
which leverages advanced natural language processing to identify patterns, risks,
and anomalies within the provided text content.

The AI system analyzed:
- Language patterns and terminology
- Structural analysis of text content
- Contextual relationship mapping
- Risk indicator identification
- Compliance and regulatory alignment

Text Content Length: {len(text_content)} characters
Analysis Timestamp: {datetime.now().isoformat()}
"""
        
        return WordAnalysisResult(
            text_content=text_content[:500] + "..." if len(text_content) > 500 else text_content,
            analysis_type=analysis_type,
            corruption_risk_level=risk_level,
            risk_score=risk_score,
            key_findings=key_findings,
            risk_indicators=risk_indicators if risk_indicators else ["No specific risk indicators detected"],
            red_flags=red_flags if red_flags else ["No critical red flags identified"],
            recommendations=recommendations,
            analysis_details=analysis_details,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error parsing word analysis response: {str(e)}")
        return WordAnalysisResult(
            text_content=text_content[:500] + "..." if len(text_content) > 500 else text_content,
            analysis_type=analysis_type,
            corruption_risk_level="Medium",
            risk_score=50,
            key_findings=["Unable to parse LightRAG response"],
            risk_indicators=["LightRAG response parsing failed"],
            red_flags=["Analysis parsing error"],
            recommendations=["Manual review recommended due to analysis parsing error"],
            analysis_details=f"Word analysis parsing failed. Raw response: {response_text[:500]}...",
            analysis_timestamp=datetime.now().isoformat()
        )

def parse_lightrag_response(response_text: str, contract_data: Dict) -> CorruptionAnalysisResult:
    """Parse LightRAG response and extract corruption analysis data"""
    try:
        # Extract risk level from response
        risk_level = "Medium"  # Default
        risk_score = 50  # Default
        
        response_lower = response_text.lower()
        
        # Risk level detection
        if any(word in response_lower for word in ['critical', 'very high', 'extremely high']):
            risk_level = "Critical"
            risk_score = 80
        elif any(word in response_lower for word in ['high risk', 'high', 'severe']):
            risk_level = "High"
            risk_score = 70
        elif any(word in response_lower for word in ['medium', 'moderate', 'moderate risk']):
            risk_level = "Medium"
            risk_score = 50
        elif any(word in response_lower for word in ['low', 'minimal', 'low risk']):
            risk_level = "Low"
            risk_score = 30
        
        # Extract indicators and red flags from response
        indicators = []
        red_flags = []
        recommendations = []
        
        # Simple pattern extraction for demo
        if 'suspicious' in response_lower:
            indicators.append("Suspicious patterns detected by AI analysis")
        if 'conflict of interest' in response_lower:
            red_flags.append("Potential conflict of interest identified")
        if 'review' in response_lower:
            recommendations.append("Additional review recommended by AI analysis")
        if 'monitor' in response_lower:
            recommendations.append("Enhanced monitoring suggested")
            
        # Default recommendations
        if not recommendations:
            recommendations = [
                "AI-powered analysis suggests standard monitoring procedures",
                "Regular compliance checks recommended",
                "Documentation of all contract activities advised"
            ]
        
        analysis_details = f"""LightRAG AI-Powered Corruption Analysis Report

Risk Assessment: {risk_level} ({risk_score}/100)

AI Analysis Summary:
{response_text}

Analysis Methodology:
This analysis was performed using LightRAG's knowledge graph technology, which leverages advanced 
natural language processing and relationship mapping to identify potential corruption patterns 
and risks within the contract documents and related entities.

The AI system considered:
- Contract language and terminology patterns
- Financial structure and amount analysis  
- Entity relationship mapping
- Historical pattern recognition
- Cross-reference with known corruption indicators

Contract Details:
- Title: {contract_data['contract_title']}
- Amount: ${contract_data['contract_amount']:,.2f}
- Type: {contract_data.get('contract_type', 'Unknown')}
"""
        
        return CorruptionAnalysisResult(
            contract_id=contract_data['contract_id'],
            corruption_risk_level=risk_level,
            risk_score=risk_score,
            corruption_indicators=indicators if indicators else ["No specific indicators identified by AI"],
            red_flags=red_flags if red_flags else ["No critical red flags detected"],
            recommendations=recommendations,
            analysis_details=analysis_details,
            analysis_timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error parsing LightRAG response: {str(e)}")
        # Return a minimal analysis structure if parsing fails
        return CorruptionAnalysisResult(
            contract_id=contract_data['contract_id'],
            corruption_risk_level="Medium",
            risk_score=50,
            corruption_indicators=["Unable to parse LightRAG response"],
            red_flags=["LightRAG response parsing failed"],
            recommendations=["Manual review recommended due to analysis parsing error"],
            analysis_details=f"LightRAG analysis parsing failed. Raw response: {response_text[:500]}...",
            analysis_timestamp=datetime.now().isoformat()
        )

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed_password

def create_access_token(user_id: str) -> str:
    """Create JWT access token"""
    expiry = datetime.utcnow() + JWT_EXPIRATION_TIME
    payload = {
        "user_id": user_id,
        "exp": expiry
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token and return user_id"""
    try:
        token = credentials.credentials
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token - no user_id")
        if user_id not in users_db:
            raise HTTPException(status_code=401, detail=f"User not found: {user_id}")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(user_id: str = Depends(verify_token)) -> dict:
    """Get current user from token"""
    return users_db[user_id]

# Initialize demo data
def initialize_demo_data():
    """Initialize demo users and contracts for testing"""
    # Clear existing data first
    users_db.clear()
    contracts_db.clear()
    
    # Demo users
    demo_users = [
        {
            "user_name": "Alice Demo",
            "user_id": "alice001",
            "user_password": hash_password("password123"),
            "company": "ABC Company",
            "e_signature": "alice001_signature_hash",
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat()
        },
        {
            "user_name": "Bob Wilson",
            "user_id": "bob002",
            "user_password": hash_password("password123"),
            "company": "ABC Company",
            "e_signature": "bob002_signature_hash",
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat()
        },
        {
            "user_name": "Carol Davis",
            "user_id": "carol003",
            "user_password": hash_password("password123"),
            "company": "XYZ Corporation",
            "e_signature": "carol003_signature_hash",
            "created_at": datetime.now().isoformat(),
            "last_login": datetime.now().isoformat()
        }
    ]
    
    for user in demo_users:
        users_db[user["user_id"]] = user
    
    # Demo contracts with clean state
    global contract_counter
    demo_contract = {
        "contract_id": "CONT_000001",
        "contract_title": "Software Development Agreement",
        "contract_content": "This agreement outlines the terms for software development services between ABC Company and XYZ Corporation. The project involves creating a custom web application with the following specifications: 1) User authentication system, 2) Dashboard interface, 3) Data analytics features, 4) Mobile responsiveness. The total project duration is estimated at 6 months with monthly milestones.",
        "contract_amount": 75000.00,
        "contract_type": "cross-company",
        "uploader_company": "ABC Company",
        "other_company": "XYZ Corporation",
        "uploader": "alice001",
        "company_signatures": {
            "ABC Company": [],
            "XYZ Corporation": []
        },
        "created_at": datetime.now().isoformat(),
        "status": "pending",
        "blockchain_index": None
    }
    
    contracts_db["CONT_000001"] = demo_contract
    contract_counter = 2

# Initialize demo data on startup
initialize_demo_data()

# Authentication Endpoints
@app.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if user already exists
    if user_data.user_id in users_db:
        raise HTTPException(status_code=400, detail="User ID already exists")
    
    # Validate company (add to list if not exists)
    if user_data.company not in companies_db:
        companies_db.append(user_data.company)
    
    # Create user
    user_dict = {
        "user_name": user_data.user_name,
        "user_id": user_data.user_id,
        "user_password": hash_password(user_data.user_password),
        "company": user_data.company,
        "e_signature": f"{user_data.user_id}_signature_hash",
        "created_at": datetime.now().isoformat(),
        "last_login": datetime.now().isoformat()
    }
    
    users_db[user_data.user_id] = user_dict
    
    # Create token
    token = create_access_token(user_data.user_id)
    
    # Return user data without password
    user_response = {k: v for k, v in user_dict.items() if k != "user_password"}
    
    return {
        "success": True,
        "message": "User registered successfully",
        "token": token,
        "user": user_response
    }

@app.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    # Check if user exists
    if credentials.user_id not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_db[credentials.user_id]
    
    # Verify password
    if not verify_password(credentials.user_password, user["user_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    users_db[credentials.user_id]["last_login"] = datetime.now().isoformat()
    
    # Create token
    token = create_access_token(credentials.user_id)
    
    # Return user data without password
    user_response = {k: v for k, v in user.items() if k != "user_password"}
    
    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": user_response
    }

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user"""
    return {
        "success": True,
        "message": "Logout successful"
    }

@app.get("/auth/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user_response = {k: v for k, v in current_user.items() if k != "user_password"}
    return {
        "success": True,
        "user": user_response
    }

@app.get("/auth/companies")
async def get_companies():
    """Get all available companies"""
    return {
        "success": True,
        "companies": companies_db
    }

@app.get("/auth/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users (admin endpoint)"""
    users_list = []
    for user_data in users_db.values():
        user_response = {k: v for k, v in user_data.items() if k != "user_password"}
        users_list.append(user_response)
    
    return {
        "success": True,
        "users": users_list
    }

# Contract Management Endpoints
@app.post("/api/contract/upload")
async def upload_contract(contract_data: ContractUpload, current_user: dict = Depends(get_current_user)):
    """Upload a new contract for signing"""
    global contract_counter
    
    try:
        print(f"[UPLOAD] User {current_user['user_id']} uploading contract: {contract_data.contract_title}")
        
        # Validate input data
        if not contract_data.contract_title.strip():
            raise HTTPException(status_code=400, detail="Contract title is required")
        
        if not contract_data.contract_content.strip():
            raise HTTPException(status_code=400, detail="Contract content is required")
            
        if len(contract_data.contract_content.strip()) < 10:
            raise HTTPException(status_code=400, detail="Contract content too short (minimum 10 characters)")
        
        if contract_data.contract_amount <= 0:
            raise HTTPException(status_code=400, detail="Contract amount must be greater than 0")
        
        if contract_data.contract_type not in ["internal", "cross-company"]:
            raise HTTPException(status_code=400, detail="Invalid contract type")
        
        if contract_data.contract_type == "cross-company" and not contract_data.other_company:
            raise HTTPException(status_code=400, detail="Other company is required for cross-company contracts")
        
        # Validate uploader matches current user
        if contract_data.uploader != current_user["user_id"]:
            print(f"[UPLOAD] Uploader mismatch: {contract_data.uploader} != {current_user['user_id']}")
            # Auto-correct the uploader to current user
            contract_data.uploader = current_user["user_id"]
        
        # Generate contract ID
        contract_id = f"CONT_{contract_counter:06d}"
        contract_counter += 1
        
        # Determine required signatures based on contract type
        required_companies = [current_user["company"]]
        if contract_data.contract_type == "cross-company" and contract_data.other_company:
            if contract_data.other_company not in users_db.values():
                # Check if other company exists
                company_exists = any(user["company"] == contract_data.other_company for user in users_db.values())
                if not company_exists:
                    raise HTTPException(status_code=400, detail=f"Company '{contract_data.other_company}' not found")
            required_companies.append(contract_data.other_company)
        
        # Initialize company signatures
        company_signatures = {}
        for company in required_companies:
            company_signatures[company] = []
        
        # Create pending contract
        pending_contract = {
            "contract_id": contract_id,
            "contract_title": contract_data.contract_title.strip(),
            "contract_content": contract_data.contract_content.strip(),
            "contract_amount": float(contract_data.contract_amount),
            "contract_type": contract_data.contract_type,
            "uploader_company": current_user["company"],
            "other_company": contract_data.other_company if contract_data.contract_type == "cross-company" else None,
            "uploader": current_user["user_id"],
            "company_signatures": company_signatures,
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "blockchain_index": None
        }
        
        contracts_db[contract_id] = pending_contract
        
        print(f"[UPLOAD] Contract {contract_id} created successfully for {current_user['company']}")
        
        return {
            "success": True,
            "message": "Contract uploaded successfully and is now pending signatures",
            "contract_id": contract_id,
            "contract": pending_contract
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload contract: {str(e)}")

@app.get("/api/contracts/pending")
async def get_pending_contracts(current_user: dict = Depends(get_current_user)):
    """Get all pending contracts for the user's company"""
    user_company = current_user["company"]
    user_id = current_user["user_id"]
    
    print(f"API: get_pending_contracts called by user {user_id} from {user_company}")
    
    # Filter contracts that involve the user's company and are pending
    relevant_contracts = []
    for contract_id, contract in contracts_db.items():
        if (contract["uploader_company"] == user_company or 
            contract.get("other_company") == user_company) and contract["status"] == "pending":
            relevant_contracts.append(contract.copy())  # Return a copy to avoid mutation
    
    print(f"API: Found {len(relevant_contracts)} pending contracts for {user_id}")
    
    return {
        "success": True,
        "contracts": relevant_contracts,
        "pending_count": len(relevant_contracts),
        "user_company": user_company
    }

@app.get("/api/contracts/all")
async def get_all_contracts(current_user: dict = Depends(get_current_user)):
    """Get all contracts accessible to the user"""
    user_company = current_user["company"]
    user_id = current_user["user_id"]
    
    print(f"API: get_all_contracts called by user {user_id} from {user_company}")
    
    # Filter contracts that involve the user's company
    relevant_contracts = []
    for contract_id, contract in contracts_db.items():
        if (contract["uploader_company"] == user_company or 
            contract.get("other_company") == user_company):
            relevant_contracts.append(contract.copy())  # Return a copy to avoid mutation
    
    print(f"API: Found {len(relevant_contracts)} contracts for {user_id}")
    
    return {
        "success": True,
        "contracts": relevant_contracts,
        "total_count": len(relevant_contracts),
        "user_company": user_company
    }

@app.get("/api/contract/{contract_id}")
async def get_contract_details(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed information about a specific contract"""
    if contract_id not in contracts_db:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = contracts_db[contract_id]
    user_company = current_user["company"]
    
    # Check if user has access to this contract
    if (contract["uploader_company"] != user_company and 
        contract.get("other_company") != user_company):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "success": True,
        "contract": contract
    }

@app.post("/api/contract/sign/{contract_id}")
async def sign_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Sign a contract with user's e-signature"""
    if contract_id not in contracts_db:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = contracts_db[contract_id]
    user_company = current_user["company"]
    user_id = current_user["user_id"]
    
    # Check if user has access to this contract
    if (contract["uploader_company"] != user_company and 
        contract.get("other_company") != user_company):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if contract is still pending
    if contract["status"] != "pending":
        raise HTTPException(status_code=400, detail="Contract is not in pending status")
    
    # Check if user's company needs to sign
    if user_company not in contract["company_signatures"]:
        raise HTTPException(status_code=400, detail="Your company is not required to sign this contract")
    
    # Check if user has already signed
    if user_id in contract["company_signatures"][user_company]:
        raise HTTPException(status_code=400, detail="You have already signed this contract")
    
    # Add user's signature
    contract["company_signatures"][user_company].append(user_id)
    
    # Check if all required signatures are collected
    all_signed = True
    for company, signatures in contract["company_signatures"].items():
        if len(signatures) == 0:
            all_signed = False
            break
    
    # If all companies have signed, move to blockchain
    if all_signed:
        print(f"[BLOCKCHAIN] Adding contract {contract_id} to blockchain")
        
        # Create enhanced blockchain transaction with contract metadata
        transaction_data = blockchain.TransactionData()
        transaction_data.amount = float(contract["contract_amount"])
        
        # Use contract ID as sender key for traceability
        transaction_data.senderKey = f"CONTRACT_{contract_id}_{contract['uploader_company']}"
        
        # Receiver key includes contract type and partner info
        if contract["contract_type"] == "cross-company" and contract.get("other_company"):
            transaction_data.receiverKey = f"CROSSCOMPANY_{contract['other_company']}"
        else:
            transaction_data.receiverKey = f"INTERNAL_{contract['uploader_company']}"
        
        transaction_data.timestamp = int(time.time())
        
        # Add to blockchain using C++ implementation
        try:
            chain.addBlock(transaction_data)
            block_index = chain.getChainSize() - 1
            
            # Validate blockchain integrity after adding
            if not chain.isChainValid():
                print(f"[BLOCKCHAIN ERROR] Blockchain validation failed after adding contract {contract_id}")
                raise Exception("Blockchain validation failed")
            
            print(f"[BLOCKCHAIN] Contract {contract_id} successfully added at block index {block_index}")
            
        except Exception as e:
            print(f"[BLOCKCHAIN ERROR] Failed to add contract to blockchain: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to add contract to blockchain: {str(e)}")
        
        # Update contract status
        contract["status"] = "completed"
        contract["blockchain_index"] = block_index
        
        return {
            "success": True,
            "message": "Contract signed successfully and added to blockchain",
            "contract_id": contract_id,
            "blockchain_index": block_index,
            "status": "completed"
        }
    else:
        return {
            "success": True,
            "message": "Contract signed successfully, waiting for other signatures",
            "contract_id": contract_id,
            "status": "pending"
        }

@app.get("/api/user/contracts")
async def get_user_contracts_on_blockchain(current_user: dict = Depends(get_current_user)):
    """Get contracts that the user has uploaded and are on the blockchain"""
    user_id = current_user["user_id"]
    
    blockchain_contracts = []
    for contract in contracts_db.values():
        if (contract["uploader"] == user_id and 
            contract["status"] == "completed" and 
            contract["blockchain_index"] is not None):
            blockchain_contracts.append(contract)
    
    return {
        "success": True,
        "contracts": blockchain_contracts
    }

# Debug endpoint to help troubleshoot contract visibility issues
@app.get("/api/debug/contracts")
async def debug_contracts(current_user: dict = Depends(get_current_user)):
    """Debug endpoint to check contract state and user access"""
    user_company = current_user["company"]
    user_id = current_user["user_id"]
    
    debug_info = {
        "user_info": {
            "user_id": user_id,
            "company": user_company,
            "is_authenticated": True
        },
        "total_contracts": len(contracts_db),
        "contracts_breakdown": [],
        "accessible_contracts": 0
    }
    
    for contract_id, contract in contracts_db.items():
        access_check = (contract["uploader_company"] == user_company or 
                       contract.get("other_company") == user_company)
        
        contract_info = {
            "contract_id": contract_id,
            "title": contract["contract_title"],
            "uploader_company": contract["uploader_company"],
            "other_company": contract.get("other_company"),
            "status": contract["status"],
            "user_has_access": access_check,
            "signatures": contract["company_signatures"]
        }
        
        debug_info["contracts_breakdown"].append(contract_info)
        if access_check:
            debug_info["accessible_contracts"] += 1
    
    return debug_info

@app.get("/")
async def read_root():
    return {"message": "Replica API is running", "platform": "Contract Management with Blockchain", "using": "C++ implementation"}

@app.get("/health")
async def health_check():
    """Health check endpoint to monitor server status"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "contracts_count": len(contracts_db),
        "users_count": len(users_db),
        "blockchain_size": chain.getChainSize() if chain else 0,
        "version": "1.0.0"
    }

@app.post("/api/test/upload")
async def test_upload(current_user: dict = Depends(get_current_user)):
    """Test endpoint to debug upload issues"""
    return {
        "success": True,
        "message": "Upload endpoint is working",
        "user": current_user,
        "timestamp": datetime.now().isoformat(),
        "contracts_count": len(contracts_db)
    }

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
        
        # Parse contract information from transaction keys
        contract_info = {}
        if block_data.senderKey.startswith("CONTRACT_"):
            # Extract contract ID and company from sender key
            parts = block_data.senderKey.split("_")
            if len(parts) >= 3:
                contract_info["contract_id"] = f"{parts[1]}_{parts[2]}"
                contract_info["uploader_company"] = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
        
        if block_data.receiverKey.startswith("CROSSCOMPANY_"):
            contract_info["type"] = "cross-company"
            contract_info["partner_company"] = block_data.receiverKey.replace("CROSSCOMPANY_", "")
        elif block_data.receiverKey.startswith("INTERNAL_"):
            contract_info["type"] = "internal"
            contract_info["company"] = block_data.receiverKey.replace("INTERNAL_", "")
        
        response_data = {
            "index": block.getIndex(),
            "hash": str(block.getHash()),
            "previousHash": str(block.getPreviousHash()),
            "data": {
                "amount": block_data.amount,
                "senderKey": block_data.senderKey,
                "receiverKey": block_data.receiverKey,
                "timestamp": block_data.timestamp,
                "timestamp_readable": datetime.fromtimestamp(block_data.timestamp).isoformat()
            },
            "contract_info": contract_info,
            "is_valid": block.isHashValid()
        }
        return {
            "message": "Block retrieved successfully", 
            "block": response_data,
            "blockchain_valid": chain.isChainValid()
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Block not found: {str(e)}")

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

@app.get("/api/blockchain/explore")
async def explore_blockchain():
    """Get all blocks in the blockchain for exploration"""
    try:
        chain_size = chain.getChainSize()
        blocks = []
        
        for i in range(chain_size):
            try:
                block = chain.getBlock(i)
                block_data = block.getData()
                
                # Parse contract information from transaction keys
                contract_info = {}
                if block_data.senderKey.startswith("CONTRACT_"):
                    # Extract contract ID and company from sender key
                    parts = block_data.senderKey.split("_")
                    if len(parts) >= 3:
                        contract_info["contract_id"] = f"{parts[1]}_{parts[2]}"
                        contract_info["uploader_company"] = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
                
                if block_data.receiverKey.startswith("CROSSCOMPANY_"):
                    contract_info["type"] = "cross-company"
                    contract_info["partner_company"] = block_data.receiverKey.replace("CROSSCOMPANY_", "")
                elif block_data.receiverKey.startswith("INTERNAL_"):
                    contract_info["type"] = "internal"
                    contract_info["company"] = block_data.receiverKey.replace("INTERNAL_", "")
                
                block_info = {
                    "index": block.getIndex(),
                    "hash": str(block.getHash()),
                    "previousHash": str(block.getPreviousHash()),
                    "data": {
                        "amount": block_data.amount,
                        "senderKey": block_data.senderKey,
                        "receiverKey": block_data.receiverKey,
                        "timestamp": block_data.timestamp,
                        "timestamp_readable": datetime.fromtimestamp(block_data.timestamp).isoformat()
                    },
                    "contract_info": contract_info,
                    "is_valid": block.isHashValid()
                }
                blocks.append(block_info)
                
            except Exception as e:
                print(f"Error reading block {i}: {str(e)}")
                blocks.append({
                    "index": i,
                    "error": f"Failed to read block: {str(e)}"
                })
        
        return {
            "message": "Blockchain exploration data",
            "chain_size": chain_size,
            "is_valid": chain.isChainValid(),
            "blocks": blocks,
            "using": "C++ implementation"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to explore blockchain: {str(e)}")

@app.get("/api/blockchain/contracts")
async def get_blockchain_contracts(current_user: dict = Depends(get_current_user)):
    """Get all contracts stored on the blockchain for the current user's company"""
    try:
        user_company = current_user["company"]
        chain_size = chain.getChainSize()
        user_contracts = []
        
        for i in range(chain_size):
            try:
                block = chain.getBlock(i)
                block_data = block.getData()
                
                # Check if this block contains a contract for the user's company
                is_user_contract = False
                contract_info = {}
                
                if block_data.senderKey.startswith("CONTRACT_"):
                    # Extract contract information
                    parts = block_data.senderKey.split("_")
                    if len(parts) >= 3:
                        contract_info["contract_id"] = f"{parts[1]}_{parts[2]}"
                        uploader_company = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
                        contract_info["uploader_company"] = uploader_company
                        
                        # Check if user's company is involved
                        if uploader_company == user_company:
                            is_user_contract = True
                
                if block_data.receiverKey.startswith("CROSSCOMPANY_"):
                    partner_company = block_data.receiverKey.replace("CROSSCOMPANY_", "")
                    contract_info["type"] = "cross-company"
                    contract_info["partner_company"] = partner_company
                    
                    # Check if user's company is the partner
                    if partner_company == user_company:
                        is_user_contract = True
                        
                elif block_data.receiverKey.startswith("INTERNAL_"):
                    company = block_data.receiverKey.replace("INTERNAL_", "")
                    contract_info["type"] = "internal"
                    contract_info["company"] = company
                    
                    if company == user_company:
                        is_user_contract = True
                
                if is_user_contract:
                    contract = {
                        "block_index": block.getIndex(),
                        "hash": str(block.getHash()),
                        "data": {
                            "amount": block_data.amount,
                            "senderKey": block_data.senderKey,
                            "receiverKey": block_data.receiverKey,
                            "timestamp": block_data.timestamp,
                            "timestamp_readable": datetime.fromtimestamp(block_data.timestamp).isoformat()
                        },
                        "contract_info": contract_info,
                        "is_valid": block.isHashValid()
                    }
                    user_contracts.append(contract)
                    
            except Exception as e:
                print(f"Error reading block {i}: {str(e)}")
        
        return {
            "message": f"Blockchain contracts for {user_company}",
            "company": user_company,
            "contracts_count": len(user_contracts),
            "contracts": user_contracts,
            "blockchain_valid": chain.isChainValid()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get blockchain contracts: {str(e)}")

@app.get("/api/blockchain/export")
async def export_blockchain_data(current_user: dict = Depends(get_current_user), include_user_contracts: bool = True):
    """Export complete blockchain data as JSON"""
    try:
        user_company = current_user["company"]
        user_id = current_user["user_id"]
        
        # Get blockchain info
        chain_size = chain.getChainSize()
        is_valid = chain.isChainValid()
        
        # Get all blocks
        blocks = []
        for i in range(chain_size):
            try:
                block = chain.getBlock(i)
                block_data = block.getData()
                
                # Parse contract information from transaction keys
                contract_info = {}
                if block_data.senderKey.startswith("CONTRACT_"):
                    # Extract contract ID and company from sender key
                    parts = block_data.senderKey.split("_")
                    if len(parts) >= 3:
                        contract_info["contract_id"] = f"{parts[1]}_{parts[2]}"
                        contract_info["uploader_company"] = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
                
                if block_data.receiverKey.startswith("CROSSCOMPANY_"):
                    contract_info["type"] = "cross-company"
                    contract_info["partner_company"] = block_data.receiverKey.replace("CROSSCOMPANY_", "")
                elif block_data.receiverKey.startswith("INTERNAL_"):
                    contract_info["type"] = "internal"
                    contract_info["company"] = block_data.receiverKey.replace("INTERNAL_", "")
                
                block_info = {
                    "index": block.getIndex(),
                    "hash": str(block.getHash()),
                    "previousHash": str(block.getPreviousHash()),
                    "data": {
                        "amount": block_data.amount,
                        "senderKey": block_data.senderKey,
                        "receiverKey": block_data.receiverKey,
                        "timestamp": block_data.timestamp,
                        "timestamp_readable": datetime.fromtimestamp(block_data.timestamp).isoformat()
                    },
                    "contract_info": contract_info,
                    "is_valid": block.isHashValid()
                }
                blocks.append(block_info)
                
            except Exception as e:
                print(f"Error reading block {i}: {str(e)}")
                blocks.append({
                    "index": i,
                    "error": f"Failed to read block: {str(e)}"
                })
        
        # Prepare export data
        export_data = {
            "exported_at": datetime.now().isoformat(),
            "blockchain_info": {
                "chain_size": chain_size,
                "is_valid": is_valid,
                "using": "C++ implementation"
            },
            "blocks": blocks,
            "export_metadata": {
                "user": user_id,
                "company": user_company,
                "total_blocks": len(blocks),
                "export_type": "complete_blockchain"
            }
        }
        
        # Add user contracts if requested
        if include_user_contracts:
            contracts_response = await get_blockchain_contracts(current_user)
            export_data["user_contracts"] = contracts_response["contracts"]
            export_data["export_metadata"]["total_user_contracts"] = len(contracts_response["contracts"])
        
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export blockchain data: {str(e)}")

@app.get("/api/contracts/export")
async def export_contracts_data(current_user: dict = Depends(get_current_user)):
    """Export all contracts data as JSON"""
    try:
        user_company = current_user["company"]
        user_id = current_user["user_id"]
        
        # Get all contracts accessible to user
        accessible_contracts = []
        for contract_id, contract in contracts_db.items():
            if (contract["uploader_company"] == user_company or 
                contract.get("other_company") == user_company):
                accessible_contracts.append(contract.copy())
        
        # Prepare export data
        export_data = {
            "exported_at": datetime.now().isoformat(),
            "contracts": accessible_contracts,
            "export_metadata": {
                "user": user_id,
                "company": user_company,
                "total_contracts": len(accessible_contracts),
                "export_type": "contracts_database"
            },
            "summary": {
                "pending_contracts": len([c for c in accessible_contracts if c["status"] == "pending"]),
                "completed_contracts": len([c for c in accessible_contracts if c["status"] == "completed"]),
                "total_value": sum(c["contract_amount"] for c in accessible_contracts)
            }
        }
        
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export contracts data: {str(e)}")

@app.post("/api/blockchain/save-json")
async def save_blockchain_json(current_user: dict = Depends(get_current_user), include_user_contracts: bool = True):
    """Save blockchain data as JSON file on server"""
    try:
        user_company = current_user["company"]
        user_id = current_user["user_id"]
        
        # Get export data
        export_data = await export_blockchain_data(current_user, include_user_contracts)
        
        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"blockchain_export_{user_company}_{timestamp}.json"
        filepath = os.path.join(os.getcwd(), "exports", filename)
        
        # Create exports directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        return {
            "success": True,
            "message": "Blockchain data saved successfully",
            "filename": filename,
            "filepath": filepath,
            "file_size": os.path.getsize(filepath),
            "data_summary": {
                "total_blocks": len(export_data["blocks"]),
                "user_contracts": len(export_data.get("user_contracts", [])),
                "blockchain_valid": export_data["blockchain_info"]["is_valid"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save blockchain JSON: {str(e)}")

# Corruption Analysis Endpoints
@app.post("/api/corruption/analyze/{contract_id}", response_model=CorruptionAnalysisResponse)
async def analyze_contract_corruption(
    contract_id: str, 
    request: CorruptionAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze a specific contract for corruption risks using LightRAG AI"""
    try:
        # Get contract data
        if contract_id not in contracts_db:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract_data = contracts_db[contract_id]
        user_company = current_user["company"]
        
        # Check access permissions
        if (contract_data["uploader_company"] != user_company and 
            contract_data.get("other_company") != user_company):
            raise HTTPException(status_code=403, detail="Access denied to this contract")
        
        # Always use LightRAG for analysis
        try:
            # Prepare corruption analysis query
            corruption_query = f"""
            Analyze this contract for potential corruption risks and provide a detailed assessment:

            Contract: {contract_data['contract_title']}
            Amount: ${contract_data['contract_amount']:,.2f}
            Content: {contract_data['contract_content']}

            Please evaluate:
            1. Risk level (Low, Medium, High, Critical)
            2. Specific corruption indicators
            3. Red flags that require immediate attention
            4. Recommendations for risk mitigation

            Provide a comprehensive analysis considering contract language, financial patterns, 
            procedural irregularities, and potential conflicts of interest.
            """
            
            lightrag_response = await call_lightrag_api(
                request.lightrag_api_url, 
                contract_data, 
                corruption_query
            )
            
            if lightrag_response:
                lightrag_analysis = parse_lightrag_response(lightrag_response, contract_data)
                
                return CorruptionAnalysisResponse(
                    success=True,
                    message="Analysis completed successfully with AI-powered LightRAG",
                    analysis_type="lightrag_advanced",
                    contract_id=contract_id,
                    lightrag_analysis=lightrag_analysis,
                    fallback_analysis=None
                )
            else:
                raise HTTPException(
                    status_code=503, 
                    detail="LightRAG analysis service is unavailable. Please ensure LightRAG is running and try again."
                )
                
        except Exception as e:
            print(f"LightRAG analysis failed: {str(e)}")
            raise HTTPException(
                status_code=503, 
                detail=f"LightRAG analysis failed: {str(e)}. Please ensure LightRAG is running and accessible."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/corruption/batch-analyze", response_model=BatchCorruptionAnalysis)
async def batch_analyze_corruption(current_user: dict = Depends(get_current_user)):
    """Perform batch corruption analysis on all accessible contracts"""
    try:
        user_company = current_user["company"]
        
        # Get all accessible contracts
        accessible_contracts = []
        for contract_id, contract in contracts_db.items():
            if (contract["uploader_company"] == user_company or 
                contract.get("other_company") == user_company):
                accessible_contracts.append((contract_id, contract))
        
        if not accessible_contracts:
            raise HTTPException(status_code=404, detail="No contracts found for analysis")
        
        detailed_results = []
        high_risk_contracts = []
        total_contract_value = 0
        total_risk_score = 0
        high_risk_count = 0
        
        # Note: Batch analysis currently disabled - LightRAG individual analysis only
        # For demonstration, create placeholder results
        for contract_id, contract_data in accessible_contracts:
            try:
                # Create simplified placeholder result for batch analysis
                # TODO: Implement LightRAG batch processing for production use
                contract_result = {
                    "contract_id": contract_id,
                    "contract_title": contract_data["contract_title"],
                    "contract_amount": contract_data["contract_amount"],
                    "corruption_risk_level": "Pending",
                    "corruption_score": 0,
                    "risk_factors": ["Batch analysis requires individual LightRAG analysis"],
                    "recommendations": ["Use individual analysis for detailed LightRAG assessment"]
                }
                
                detailed_results.append(contract_result)
                total_contract_value += contract_data["contract_amount"]
                    
            except Exception as e:
                print(f"Error processing contract {contract_id}: {str(e)}")
                continue
        
        # Calculate summary statistics
        avg_risk_score = total_risk_score / len(detailed_results) if detailed_results else 0
        immediate_attention = len([r for r in detailed_results if r["corruption_score"] >= 60])
        
        summary = {
            "total_contracts_analyzed": len(detailed_results),
            "high_risk_contracts": high_risk_count,
            "total_contract_value": total_contract_value,
            "average_corruption_score": avg_risk_score,
            "requires_immediate_attention": immediate_attention
        }
        
        return BatchCorruptionAnalysis(
            success=True,
            message=f"Batch analysis completed for {len(detailed_results)} contracts",
            summary=summary,
            detailed_results=detailed_results,
            high_risk_contracts=high_risk_contracts
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@app.post("/api/word/analyze", response_model=WordAnalysisResponse)
async def analyze_word_content(
    request: WordAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze contract content for sensitive words using LightRAG AI"""
    try:
        if not request.contract_id.strip():
            raise HTTPException(status_code=400, detail="Contract ID is required")
        
        # Get contract data
        if request.contract_id not in contracts_db:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract_data = contracts_db[request.contract_id]
        contract_content = contract_data['contract_content']
        
        if not contract_content or len(contract_content.strip()) < 10:
            raise HTTPException(status_code=400, detail="Contract content is too short for analysis")
        
        # Always use LightRAG for analysis
        try:
            # Sensitive word detection analysis only
            analysis_query = f"""
            Analyze this contract content for sensitive words and potentially problematic language:

            Contract Title: {contract_data['contract_title']}
            Contract Content: {contract_content}

            Please identify and evaluate:
            1. Sensitive or inappropriate words and phrases
            2. Language that could indicate bias, discrimination, or misconduct
            3. Terms that may violate professional or ethical standards
            4. Potentially offensive or problematic expressions
            5. Words that could indicate corruption, fraud, or unethical behavior
            6. Language that suggests conflicts of interest or improper relationships
            7. Terms that might indicate regulatory or compliance violations

            Provide a detailed analysis including:
            - Risk level assessment (Low, Medium, High, Critical)
            - Specific sensitive words or phrases found
            - Context and implications of identified language
            - Recommendations for language improvement or replacement
            - Potential impact on reputation or compliance

            Focus on detecting language patterns that could be problematic in professional, legal, 
            or business contexts, including but not limited to corruption indicators, discriminatory 
            language, inappropriate terminology, and words that suggest unethical practices.
            """
            
            lightrag_response = await call_lightrag_api_for_text(
                request.lightrag_api_url, 
                contract_content, 
                analysis_query
            )
            
            if lightrag_response:
                word_analysis = parse_word_analysis_response(
                    lightrag_response, 
                    contract_content, 
                    request.analysis_type
                )
                
                return WordAnalysisResponse(
                    success=True,
                    message=f"Sensitive word analysis completed for contract: {contract_data['contract_title']}",
                    analysis_type="lightrag_advanced",
                    word_analysis=word_analysis
                )
            else:
                raise HTTPException(
                    status_code=503, 
                    detail="LightRAG analysis service is unavailable. Please ensure LightRAG is running and try again."
                )
                
        except Exception as e:
            print(f"LightRAG word analysis failed: {str(e)}")
            raise HTTPException(
                status_code=503, 
                detail=f"LightRAG analysis failed: {str(e)}. Please ensure LightRAG is running and accessible."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Word analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="127.0.0.1",  # Bind to localhost only for better performance
        port=8000, 
        reload=False,
        workers=1,  # Single worker to prevent resource conflicts
        access_log=False,  # Disable access logs for better performance
        log_level="warning"  # Reduce log verbosity
    )
