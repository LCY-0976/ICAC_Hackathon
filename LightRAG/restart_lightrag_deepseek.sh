#!/bin/bash

# Script to restart LightRAG server with DeepSeek configuration

echo "🔄 Restarting LightRAG server with DeepSeek configuration..."

# Kill any existing LightRAG processes
echo "   Stopping existing LightRAG processes..."
pkill -f "lightrag" 2>/dev/null || echo "   No existing processes found"

# Wait a moment for processes to stop
sleep 2

# Set environment variables and start the server
echo "   Starting LightRAG server with DeepSeek..."
cd "/Users/lcy/ICAC Hackathon/LightRAG"

export LLM_BINDING=openai
export LLM_MODEL=deepseek-chat
export LLM_BINDING_HOST=https://api.deepseek.com
export LLM_BINDING_API_KEY=sk-b1e619941a694324b574f036eb27400f
export OPENAI_API_KEY=sk-b1e619941a694324b574f036eb27400f
export EMBEDDING_BINDING=ollama
export EMBEDDING_MODEL=bge-m3:latest
export EMBEDDING_BINDING_HOST=http://localhost:11434
export EMBEDDING_DIM=1024
export WORKING_DIR=/Users/lcy/ICAC\ Hackathon/LightRAG/rag_storage
export HOST=0.0.0.0
export PORT=9621

echo "🚀 Starting server..."
echo "   LLM: $LLM_MODEL via $LLM_BINDING_HOST"
echo "   Embedding: $EMBEDDING_MODEL via $EMBEDDING_BINDING_HOST"
echo "   Server will be available at: http://localhost:$PORT"
echo ""

# Start the server
python -m lightrag.api.lightrag_server
