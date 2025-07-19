# Blockchain API - C++ Implementation with FastAPI

A high-performance blockchain implementation written in C++ with Python FastAPI integration, built for the ICAC Hackathon.

## 🚀 Features

- **High-Performance C++ Blockchain**: Core blockchain logic implemented in C++ for optimal performance
- **Python FastAPI Integration**: Modern REST API using FastAPI with automatic documentation
- **Block Creation & Validation**: Create transactions and validate blockchain integrity
- **Hash-based Security**: SHA-256 equivalent hashing for block security
- **Real-time API**: Live blockchain operations through HTTP endpoints

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI       │    │   Python         │    │   C++           │
│   (REST API)    │◄──►│   Bindings       │◄──►│   Blockchain    │
│                 │    │   (pybind11)     │    │   Core          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
ICAC Hackathon/
├── api.py                 # FastAPI server with blockchain endpoints
├── blockchain.cpp         # C++ blockchain implementation
├── setup.py              # Build configuration for C++ module
├── requirements.txt       # Python dependencies
├── test_api.py           # API testing script
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status and info |
| GET | `/api/blockchain/info` | Blockchain information |
| POST | `/api/block` | Create new transaction/block |
| GET | `/api/block/{index}` | Retrieve specific block |
| GET | `/api/blockchain/validate` | Validate blockchain integrity |

### 📖 Interactive Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## 🧪 Usage Examples

### 1. Check Blockchain Status
```bash
curl http://localhost:8000/api/blockchain/info
```

### 2. Create a Transaction
```bash
curl -X POST http://localhost:8000/api/block \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.5,
    "sender": "Alice", 
    "receiver": "Bob",
    "timestamp": "1234567890"
  }'
```

### 3. Retrieve a Block
```bash
curl http://localhost:8000/api/block/1
```

### 4. Validate Blockchain
```bash
curl http://localhost:8000/api/blockchain/validate
```

## 🧪 Testing

Run the comprehensive test suite:
```bash
python test_api.py
```

Test C++ module directly:
```bash
python -c "import blockchain; bc = blockchain.Blockchain(); print(f'Chain size: {bc.getChainSize()}')"
```

## 🏛️ C++ Blockchain Components

### Classes
- **TransactionData**: Transaction information (amount, sender, receiver, timestamp)
- **Block**: Individual block with hash, previous hash, and transaction data
- **Blockchain**: Main blockchain class with validation and block management

### Key Methods
- `addBlock(TransactionData)`: Add new block to chain
- `getBlock(index)`: Retrieve block by index
- `isChainValid()`: Validate entire blockchain
- `getChainSize()`: Get number of blocks

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test your changes: `python test_api.py`
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
- **Production-Ready Code**: Comprehensive testing and validation

---

**Built with ❤️ for ICAC Hackathon**
