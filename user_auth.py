#!/usr/bin/env python3
"""
User Authentication Module
Handles user creation, login, and e-signature generation
"""

import hashlib
import json
from typing import Dict, Optional
from datetime import datetime
import os

class User:
    """User class with e-signature functionality"""
    
    def __init__(self, user_name: str, user_id: str, user_password: str):
        self.user_name = user_name
        self.user_id = user_id
        self.user_password = user_password
        self.e_signature = self.generate_e_signature()
        self.created_at = datetime.now().isoformat()
        self.last_login = None
    
    def generate_e_signature(self) -> str:
        """Generate e-signature using SHA256 hash of username + user_id + password"""
        signature_data = f"{self.user_name}{self.user_id}{self.user_password}"
        return hashlib.sha256(signature_data.encode('utf-8')).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify if the provided password matches the user's password"""
        return self.user_password == password
    
    def update_last_login(self):
        """Update the last login timestamp"""
        self.last_login = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        """Convert user object to dictionary (excluding password for security)"""
        return {
            "user_name": self.user_name,
            "user_id": self.user_id,
            "e_signature": self.e_signature,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
    
    def to_dict_with_password(self) -> Dict:
        """Convert user object to dictionary including password (for storage)"""
        return {
            "user_name": self.user_name,
            "user_id": self.user_id,
            "user_password": self.user_password,
            "e_signature": self.e_signature,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
    
    @classmethod
    def from_dict(cls, data: Dict):
        """Create User object from dictionary"""
        user = cls(data["user_name"], data["user_id"], data["user_password"])
        user.e_signature = data["e_signature"]
        user.created_at = data["created_at"]
        user.last_login = data.get("last_login")
        return user

class UserManager:
    """Manages user registration, login, and storage"""
    
    def __init__(self, storage_file: str = "users.json"):
        self.storage_file = storage_file
        self.users: Dict[str, User] = {}
        self.logged_in_users: Dict[str, User] = {}
        self.load_users()
    
    def load_users(self):
        """Load users from storage file"""
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r') as f:
                    users_data = json.load(f)
                    for user_id, user_data in users_data.items():
                        self.users[user_id] = User.from_dict(user_data)
                print(f"✅ Loaded {len(self.users)} users from {self.storage_file}")
            except Exception as e:
                print(f"⚠️ Error loading users: {e}")
        else:
            print(f"📝 No existing user file found. Starting fresh.")
    
    def save_users(self):
        """Save users to storage file"""
        try:
            users_data = {user_id: user.to_dict_with_password() 
                         for user_id, user in self.users.items()}
            with open(self.storage_file, 'w') as f:
                json.dump(users_data, f, indent=2)
            print(f"✅ Saved {len(self.users)} users to {self.storage_file}")
        except Exception as e:
            print(f"❌ Error saving users: {e}")
    
    def register_user(self, user_name: str, user_id: str, user_password: str) -> Dict:
        """Register a new user"""
        if user_id in self.users:
            return {"success": False, "message": "User ID already exists"}
        
        if len(user_password) < 6:
            return {"success": False, "message": "Password must be at least 6 characters"}
        
        user = User(user_name, user_id, user_password)
        self.users[user_id] = user
        self.save_users()
        
        return {
            "success": True, 
            "message": "User registered successfully",
            "user": user.to_dict()
        }
    
    def login_user(self, user_id: str, user_password: str) -> Dict:
        """Login user and return user info with e-signature"""
        if user_id not in self.users:
            return {"success": False, "message": "User not found"}
        
        user = self.users[user_id]
        if not user.verify_password(user_password):
            return {"success": False, "message": "Invalid password"}
        
        # Update last login and mark as logged in
        user.update_last_login()
        self.logged_in_users[user_id] = user
        self.save_users()
        
        return {
            "success": True,
            "message": "Login successful",
            "user": user.to_dict(),
            "session_token": user.e_signature  # Using e-signature as session token
        }
    
    def logout_user(self, user_id: str) -> Dict:
        """Logout user"""
        if user_id in self.logged_in_users:
            del self.logged_in_users[user_id]
            return {"success": True, "message": "Logout successful"}
        return {"success": False, "message": "User not logged in"}
    
    def get_user_by_signature(self, e_signature: str) -> Optional[User]:
        """Get user by e-signature"""
        for user in self.users.values():
            if user.e_signature == e_signature:
                return user
        return None
    
    def is_user_logged_in(self, user_id: str) -> bool:
        """Check if user is currently logged in"""
        return user_id in self.logged_in_users
    
    def verify_signature(self, user_id: str, e_signature: str) -> bool:
        """Verify if the e-signature matches the user"""
        if user_id in self.users:
            return self.users[user_id].e_signature == e_signature
        return False
    
    def get_all_users(self) -> Dict:
        """Get all users (without passwords)"""
        return {user_id: user.to_dict() for user_id, user in self.users.items()}

# Global user manager instance
user_manager = UserManager()

def create_test_users():
    """Create some test users for demonstration"""
    test_users = [
        ("Alice Johnson", "alice001", "password123"),
        ("Bob Smith", "bob002", "securepass"),
        ("Charlie Brown", "charlie003", "mypassword")
    ]
    
    for name, user_id, password in test_users:
        result = user_manager.register_user(name, user_id, password)
        if result["success"]:
            print(f"✅ Created test user: {name} (ID: {user_id})")
            print(f"   E-signature: {result['user']['e_signature']}")
        else:
            print(f"⚠️ Test user {name} already exists")

if __name__ == "__main__":
    # Test the user authentication system
    print("🔐 Testing User Authentication System")
    print("=" * 50)
    
    # Create test users
    create_test_users()
    
    print("\n🧪 Testing login functionality:")
    
    # Test login
    login_result = user_manager.login_user("alice001", "password123")
    if login_result["success"]:
        print(f"✅ Login successful for Alice")
        print(f"   E-signature: {login_result['user']['e_signature']}")
        print(f"   Session token: {login_result['session_token']}")
    else:
        print(f"❌ Login failed: {login_result['message']}")
    
    # Test invalid login
    invalid_login = user_manager.login_user("alice001", "wrongpassword")
    print(f"🔒 Invalid password test: {invalid_login['message']}")
    
    print(f"\n📊 Total users registered: {len(user_manager.users)}")
    print(f"👥 Currently logged in: {len(user_manager.logged_in_users)}") 