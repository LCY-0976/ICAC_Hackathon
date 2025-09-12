#!/usr/bin/env python3
"""
Start LightRAG server with DeepSeek configuration
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set environment variables explicitly for DeepSeek
os.environ['LLM_BINDING'] = 'openai'
os.environ['LLM_MODEL'] = 'deepseek-chat'
os.environ['LLM_BINDING_HOST'] = 'https://api.deepseek.com'
os.environ['LLM_BINDING_API_KEY'] = os.getenv('LLM_BINDING_API_KEY', 'sk-b1e619941a694324b574f036eb27400f')
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', 'sk-b1e619941a694324b574f036eb27400f')
os.environ['EMBEDDING_BINDING'] = 'ollama'
os.environ['EMBEDDING_MODEL'] = 'bge-m3:latest'
os.environ['EMBEDDING_BINDING_HOST'] = 'http://localhost:11434'
os.environ['EMBEDDING_DIM'] = '1024'
os.environ['WORKING_DIR'] = '/Users/lcy/ICAC Hackathon/LightRAG/rag_storage'
os.environ['HOST'] = '0.0.0.0'
os.environ['PORT'] = '8020'

print("🚀 Starting LightRAG server with DeepSeek configuration...")
print(f"   LLM: {os.environ['LLM_MODEL']} via {os.environ['LLM_BINDING_HOST']}")
print(f"   Embedding: {os.environ['EMBEDDING_MODEL']} via {os.environ['EMBEDDING_BINDING_HOST']}")
print(f"   Server: {os.environ['HOST']}:{os.environ['PORT']}")
print(f"   Working Dir: {os.environ['WORKING_DIR']}")

# Import and start the server
try:
    from lightrag.api.lightrag_server import create_app
    from lightrag.api.config import parse_args
    import uvicorn
    
    # Parse arguments with environment variables
    args = parse_args()
    
    # Create the app with our configuration
    app = create_app(args)
    
    # Run the server
    uvicorn.run(
        app,
        host=os.environ['HOST'],
        port=int(os.environ['PORT']),
        reload=False,
        log_level="info"
    )
    
except Exception as e:
    print(f"❌ Failed to start server: {e}")
    sys.exit(1)
