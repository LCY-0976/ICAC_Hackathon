#!/usr/bin/env python3
"""
Helper script to update DeepSeek API key in .env file
"""

import os
import re

def update_api_key():
    """Update the API key in .env file"""
    env_file = ".env"
    
    if not os.path.exists(env_file):
        print("❌ .env file not found!")
        return False
    
    print("🔑 DeepSeek API Key Updater")
    print("=" * 40)
    
    # Get API key from user
    api_key = input("Enter your DeepSeek API key (starts with sk-): ").strip()
    
    if not api_key:
        print("❌ No API key provided!")
        return False
    
    if not api_key.startswith("sk-"):
        print("⚠️  Warning: DeepSeek API keys usually start with 'sk-'")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return False
    
    # Read current .env file
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Update the API key lines
    patterns = [
        (r'LLM_BINDING_API_KEY=.*', f'LLM_BINDING_API_KEY={api_key}'),
        (r'OPENAI_API_KEY=.*', f'OPENAI_API_KEY={api_key}')
    ]
    
    updated_content = content
    for pattern, replacement in patterns:
        updated_content = re.sub(pattern, replacement, updated_content)
    
    # Write back to file
    with open(env_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ API key updated successfully!")
    print(f"   Updated: LLM_BINDING_API_KEY")
    print(f"   Updated: OPENAI_API_KEY")
    print()
    print("🚀 Next steps:")
    print("   1. Test configuration: python test_deepseek_config.py")
    print("   2. Start LightRAG server: python -m lightrag.api.lightrag_server")
    
    return True

if __name__ == "__main__":
    update_api_key()
