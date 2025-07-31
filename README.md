# Blockchain API - C++ Implementation with FastAPI & User Authentication

A high-performance blockchain implementation written in C++ with Python FastAPI integration and user authentication system, built for the ICAC Hackathon.

## 🚀 Features

- **High-Performance C++ Blockchain**: Core blockchain logic implemented in C++ for optimal performance
- **User Authentication System**: Secure user registration and login with session management
- **E-Signature Integration**: SHA256-based e-signatures generated from user credentials
- **Python FastAPI Integration**: Modern REST API with automatic documentation
- **Authenticated Blockchain Operations**: Blockchain transactions require user authentication
- **Block Creation & Validation**: Create transactions and validate blockchain integrity
- **Hash-based Security**: SHA-256 equivalent hashing for block security
- **Real-time API**: Live blockchain operations through HTTP endpoints

## 🔐 Authentication System

### User Object Structure
```python
User {
    user_name: str        # Full name of the user
    user_id: str         # Unique user identifier
    user_password: str   # User password (stored securely)
    e_signature: str     # SHA256 hash of username + user_id + password
    created_at: str      # Registration timestamp
    last_login: str      # Last login timestamp
}
```

### E-Signature Generation
E-signatures are generated using SHA256 hash:
```python
e_signature = SHA256(user_name + user_id + user_password)
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   User Auth      │    │   C++           │
│   (REST API)    │◄──►│   + E-Signature  │◄──►│   Blockchain    │
│                 │    │   (Python)       │    │   Core          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
ICAC Hackathon/
├── api.py                 # FastAPI server with authentication & blockchain endpoints
├── user_auth.py          # User authentication module with e-signature generation
├── blockchain.cpp         # C++ blockchain implementation
├── setup.py              # Build configuration for C++ module
├── requirements.txt       # Python dependencies
├── test_api.py           # Basic API testing script
├── test_auth_api.py      # Comprehensive authentication + blockchain test
├── users.json            # User storage file (auto-generated)
└── README.md             # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- C++ compiler (clang++ on macOS)
- pip or conda

### 1. Clone the Repository
```bash
git clone https://github.com/LCY-0976/ICAC_Hackathon.git
cd "ICAC Hackathon"
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
pip install pybind11
```

### 3. Build C++ Module
```bash
python setup.py build_ext --inplace
```

### 4. Start the API Server
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

## 🌐 API Endpoints

### Base URL: `http://localhost:8000`

#### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user with e-signature | ❌ |
| POST | `/auth/login` | Login and get session token | ❌ |
| POST | `/auth/logout` | Logout current user | ✅ |
| GET | `/auth/profile` | Get current user profile | ✅ |
| GET | `/auth/users` | Get all registered users | ❌ |

#### Blockchain Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API status and info | ❌ |
| GET | `/api/blockchain/info` | Blockchain information | ❌ |
| POST | `/api/block` | Create new transaction/block | ✅ |
| GET | `/api/block/{index}` | Retrieve specific block | ❌ |
| GET | `/api/blockchain/validate` | Validate blockchain integrity | ❌ |
| GET | `/api/user/blocks` | Get all blocks (user view) | ✅ |

### 📖 Interactive Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## 🧪 Usage Examples

### 1. Register a New User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "Alice Johnson",
    "user_id": "alice001", 
    "user_password": "password123"
  }'
```

### 2. Login and Get E-Signature Token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "alice001",
    "user_password": "password123"
  }'
```

### 3. Create Authenticated Transaction
```bash
curl -X POST http://localhost:8000/api/block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_E_SIGNATURE_TOKEN" \
  -d '{
    "amount": 100.5,
    "sender": "Alice", 
    "receiver": "Bob",
    "timestamp": "1234567890"
  }'
```

### 4. Get User Profile
```bash
curl -X GET http://localhost:8000/auth/profile \
  -H "Authorization: Bearer YOUR_E_SIGNATURE_TOKEN"
```

### 5. Check Blockchain Status
```bash
curl http://localhost:8000/api/blockchain/info
```

## 🧪 Testing

### Test User Authentication System
```bash
python user_auth.py
```

### Test Basic API
```bash
python test_api.py
```

### Test Complete Authentication + Blockchain Integration
```bash
python test_auth_api.py
```

### Test C++ Module Directly
```bash
python -c "import blockchain; bc = blockchain.Blockchain(); print(f'Chain size: {bc.getChainSize()}')"
```

## 🏛️ Components

### C++ Blockchain Classes
- **TransactionData**: Transaction information (amount, sender, receiver, timestamp)
- **Block**: Individual block with hash, previous hash, and transaction data
- **Blockchain**: Main blockchain class with validation and block management

### Python Authentication Classes
- **User**: User object with e-signature generation
- **UserManager**: Handles registration, login, and user storage

### Key Methods
- `addBlock(TransactionData)`: Add new block to chain
- `getBlock(index)`: Retrieve block by index
- `isChainValid()`: Validate entire blockchain
- `register_user()`: Register new user with e-signature
- `login_user()`: Authenticate user and return session token
- `generate_e_signature()`: Create SHA256 e-signature

## 🔧 Development

### Rebuilding C++ Module
If you modify `blockchain.cpp`:
```bash
python setup.py build_ext --inplace
```

### Running in Development Mode
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

## 🚀 Deployment

### Production Server
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker (Optional)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
RUN python setup.py build_ext --inplace
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Security Features

- **E-Signature Authentication**: Each user has a unique SHA256 e-signature
- **Session Management**: Token-based authentication using e-signatures
- **Protected Endpoints**: Blockchain operations require authentication
- **Password Validation**: Minimum password requirements
- **User Isolation**: Each user's transactions are tracked

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test your changes: `python test_auth_api.py`
5. Commit: `git commit -am 'Add new feature'`
6. Push: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is developed for the ICAC Hackathon.

## 🏆 ICAC Hackathon

This blockchain implementation demonstrates:
- **High-Performance Computing**: C++ core for optimal speed
- **Modern API Design**: FastAPI with automatic documentation
- **Cross-Language Integration**: Seamless C++/Python integration
- **User Authentication**: Secure login with e-signature generation
- **Blockchain Security**: Authenticated transactions with user tracking
- **Production-Ready Code**: Comprehensive testing and validation

## 📊 Example E-Signatures

When users register, their e-signatures are automatically generated:

```
User: Alice Johnson (alice001) + password123
E-Signature: 08dc2eef3714679b25197976c7da73c41951db2d508fce0021212e7af604d61d

User: Bob Smith (bob002) + securepass  
E-Signature: c6dd87858d8e18a5f50a8cbf4a665ccaeb567ba8b06cb0aee69a6622e8dc6ad4
```

---

**Built with ❤️ for ICAC Hackathon - Now with User Authentication & E-Signatures!**
