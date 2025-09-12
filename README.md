# ICAC Hackathon - Blockchain & LightRAG Integration

A comprehensive system combining high-performance blockchain implementation with advanced LightRAG AI capabilities, featuring a modern web interface for corruption analysis and document processing.

## 🚀 Features

- **High-Performance C++ Blockchain**: Core blockchain logic implemented in C++ for optimal performance
- **Python FastAPI Integration**: Modern REST API using FastAPI with automatic documentation
- **LightRAG AI Integration**: Advanced retrieval-augmented generation for document analysis
- **Modern Web Interface**: React-based frontend with corruption analysis capabilities
- **Block Creation & Validation**: Create transactions and validate blockchain integrity
- **Hash-based Security**: SHA-256 equivalent hashing for block security
- **Real-time API**: Live blockchain operations through HTTP endpoints

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React         │    │   FastAPI        │    │   LightRAG      │
│   Frontend      │◄──►│   (REST API)     │◄──►│   AI Engine     │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Python         │    │   C++           │
                       │   Bindings       │◄──►│   Blockchain    │
                       │   (pybind11)     │    │   Core          │
                       └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
ICAC Hackathon/
├── api.py                    # FastAPI server with blockchain endpoints
├── blockchain.cpp            # C++ blockchain implementation
├── setup.py                 # Build configuration for C++ module
├── requirements.txt          # Python dependencies
├── test_api.py              # API testing script
├── frontend/                 # React frontend application
│   ├── src/                 # React source code
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
├── LightRAG/                # LightRAG AI engine
│   ├── lightrag/           # Core LightRAG modules
│   ├── examples/           # Usage examples
│   ├── lightrag_webui/     # LightRAG web interface
│   └── start_lightrag_with_deepseek.py  # Startup script
└── README.md               # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- C++ compiler (clang++ on macOS)
- pip or conda
- Ollama (for local LLM support)

### Installing Ollama

Ollama enables you to run large language models locally, providing privacy and reducing dependency on external APIs. This is especially useful for the LightRAG AI engine.

#### macOS Installation

**Method 1: Download from Official Website (Recommended)**
1. Visit [https://ollama.ai](https://ollama.ai)
2. Click "Download for macOS"
3. Open the downloaded `.dmg` file
4. Drag Ollama to Applications folder
5. Launch Ollama from Applications

**Method 2: Using Homebrew**
```bash
brew install ollama
```

#### Linux Installation

**Ubuntu/Debian:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Manual Installation:**
```bash
# Download and install
curl -L https://ollama.ai/download/ollama-linux-amd64 -o /usr/local/bin/ollama
chmod +x /usr/local/bin/ollama

# Create ollama user (optional but recommended)
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama
```

#### Windows Installation

1. Visit [https://ollama.ai](https://ollama.ai)
2. Click "Download for Windows"
3. Run the downloaded installer
4. Follow the installation wizard

#### Verifying Installation

After installation, verify Ollama is working:
```bash
ollama --version
```

#### Installing and Running Models

**Start Ollama service:**
```bash
# The service should start automatically, but you can start it manually:
ollama serve
```

**Download and run the required model:**
```bash
# BGE-M3 model (required for LightRAG)
ollama pull bge-m3:latest

# List available models
ollama list

# Run the model interactively
ollama run bge-m3:latest
```

#### Configuring LightRAG with Ollama

To use Ollama with LightRAG, update your `LightRAG/config.ini`:

```ini
[DEFAULT]
model_provider = ollama
base_url = http://localhost:11434
model_name = bge-m3:latest
# No API key needed for local Ollama
```

Or use the Ollama-specific example:
```bash
cd LightRAG
python examples/lightrag_ollama_demo.py
```

#### Ollama Performance Tips

- **Memory**: Ensure you have sufficient RAM (4GB+ recommended for BGE-M3)
- **GPU**: Ollama automatically uses GPU acceleration if available (NVIDIA/AMD)
- **BGE-M3**: This embedding model is optimized for multilingual retrieval and is specifically designed for RAG applications

#### Troubleshooting Ollama

**Service not running:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama service
ollama serve

# Check Ollama logs (macOS)
tail -f ~/.ollama/logs/server.log
```

**Model download issues:**
```bash
# Clear cache and retry
ollama rm <model_name>
ollama pull <model_name>

# Check available space
df -h
```

### 1. Clone the Repository
```bash
git clone https://github.com/LCY-0976/ICAC_Hackathon.git
cd "ICAC Hackathon"
```

### 2. Install Backend Dependencies
```bash
pip install -r requirements.txt
pip install pybind11--target./
```

### 3. Build C++ Module
```bash
python setup.py build_ext --inplace
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```


## 🚀 Running the System

The system consists of three main components that can be run independently or together:

### Option 1: Quick Start (All Components)

Run all components with these commands in separate terminals:

**Terminal 1 - Start LightRAG Server:**
```bash
cd LightRAG
python start_lightrag_with_deepseek.py
# LightRAG will be available at http://localhost:9621
```

**Terminal 2 - Start Backend API:**
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
# API will be available at http://localhost:8000
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm run dev
# Frontend will be available at http://localhost:5173
```

### Option 2: Individual Component Setup

#### 🧠 Starting LightRAG

LightRAG provides AI-powered document analysis and retrieval capabilities.

**Method 1: Using DeepSeek (Recommended)**
```bash
cd LightRAG
python start_lightrag_with_deepseek.py
```

**Method 2: Using LightRAG Server**
```bash
cd LightRAG
# Make sure config.ini is configured with your API keys
lightrag-server
```

**Method 3: Using Docker**
```bash
cd LightRAG
cp env.example .env
# Edit .env with your API configuration
docker compose up
```

**Access LightRAG:**
- Web Interface: http://localhost:8020
- API Documentation: http://localhost:8020/docs

#### ⚙️ Starting the Backend API

The FastAPI backend provides blockchain operations and integrates with LightRAG.

```bash
# Development mode (with auto-reload)
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Production mode
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

**Access API:**
- Base URL: http://localhost:8000
- Interactive Documentation: http://localhost:8000/docs
- OpenAPI Schema: http://localhost:8000/openapi.json

#### 🌐 Starting the Frontend

The React frontend provides a modern web interface for the system.

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Access Frontend:**
- Development: http://localhost:5173
- Features: Corruption analysis, document upload, blockchain interaction

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

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root (optional):
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# LightRAG Configuration
LIGHTRAG_PORT=8020
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### LightRAG Configuration

Configure LightRAG in `LightRAG/config.ini`:
```ini
[DEFAULT]
model_provider = deepseek
api_key = your_deepseek_api_key
base_url = https://api.deepseek.com
```

### Frontend Configuration

The frontend will automatically connect to:
- Backend API: http://localhost:8000
- LightRAG API: http://localhost:8020

## 🧪 Testing

### Backend Testing
```bash
# Test the comprehensive API suite
python test_api.py

# Test C++ blockchain module directly
python -c "import blockchain; bc = blockchain.Blockchain(); print(f'Chain size: {bc.getChainSize()}')"

# Test blockchain integration
python test_blockchain_integration.py
```

### Frontend Testing
```bash
cd frontend
npm run lint
npm run build  # Verify build works
```

### LightRAG Testing
```bash
cd LightRAG
# Test with sample document
python examples/lightrag_openai_demo.py
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

**Backend API:**
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview  # or serve with nginx/apache
```

**LightRAG:**
```bash
cd LightRAG
lightrag-server --host 0.0.0.0 --port 8020
```

### Docker (Optional)

**Complete Stack with Docker Compose:**
```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d
```

**Individual Components:**
```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
RUN python setup.py build_ext --inplace
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Troubleshooting

### Common Issues

**LightRAG Won't Start:**
```bash
# Check if ports are available
lsof -i :8020

# Check Python dependencies
cd LightRAG
pip install -e .

# Check configuration
cat config.ini
```

**Frontend Build Errors:**
```bash
cd frontend
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

**API Connection Issues:**
```bash
# Check if C++ module compiled correctly
python -c "import blockchain; print('Blockchain module loaded successfully')"

# Rebuild C++ module if needed
python setup.py build_ext --inplace --force

# Check API server
curl http://localhost:8000/
```

**Port Conflicts:**
- Frontend (5173): Change in `vite.config.ts`
- Backend (8000): Use `--port` flag with uvicorn
- LightRAG (8020): Configure in `config.ini` or startup script

### System Requirements

**Minimum:**
- 4GB RAM
- 2 CPU cores
- 10GB free disk space

**Recommended:**
- 8GB+ RAM
- 4+ CPU cores
- 20GB+ free disk space
- SSD storage for better performance

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

This comprehensive system demonstrates:
- **High-Performance Computing**: C++ blockchain core for optimal speed
- **Modern Web Architecture**: React frontend with FastAPI backend
- **AI Integration**: LightRAG for advanced document analysis
- **Cross-Language Integration**: Seamless C++/Python integration
- **Production-Ready Code**: Comprehensive testing and validation

## 🔗 Quick Access URLs

After starting all services, access the system at:

| Component | URL | Description |
|-----------|-----|-------------|
| **Frontend Web App** | http://localhost:5173 | Main web interface for corruption analysis |
| **Backend API** | http://localhost:8000 | Blockchain API and system backend |
| **API Documentation** | http://localhost:8000/docs | Interactive API documentation |
| **LightRAG Web UI** | http://localhost:8020 | AI document analysis interface |
| **LightRAG API** | http://localhost:8020/docs | LightRAG API documentation |

## 📝 Usage Workflow

1. **Start all services** using the Quick Start guide above
2. **Access the frontend** at http://localhost:5173
3. **Upload documents** for corruption analysis via the web interface
4. **Use LightRAG** at http://localhost:8020 for advanced AI document processing
5. **Monitor blockchain** operations via the API at http://localhost:8000
6. **View interactive docs** at respective `/docs` endpoints

---

**Built with ❤️ for ICAC Hackathon**
