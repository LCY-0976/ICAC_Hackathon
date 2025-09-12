#!/usr/bin/env python3
"""
Simple LightRAG server startup without external dependencies
"""

import os
import sys

# Set basic configuration for LightRAG
os.environ['WORKING_DIR'] = '/Users/lcy/ICAC Hackathon/LightRAG/rag_storage'
os.environ['HOST'] = '0.0.0.0'
os.environ['PORT'] = '8020'

print("🚀 Starting LightRAG server...")
print(f"   Server: {os.environ['HOST']}:{os.environ['PORT']}")
print(f"   Working Dir: {os.environ['WORKING_DIR']}")

try:
    from lightrag.api.lightrag_server import create_app
    import uvicorn
    
    # Create the app
    app = create_app()
    
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
    import traceback
    traceback.print_exc()
    sys.exit(1)
