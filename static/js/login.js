// API Configuration
const API_BASE_URL = window.location.origin;

// DOM Elements
let currentForm = 'login';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token is still valid
        verifyToken(token);
    }

    // Set up form event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

function toggleForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (currentForm === 'login') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        currentForm = 'register';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        currentForm = 'login';
    }
    
    // Clear any previous messages
    clearMessages();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('loginUserId').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!userId || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                user_password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store authentication token
            localStorage.setItem('authToken', data.session_token);
            localStorage.setItem('userInfo', JSON.stringify(data.user));
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
            
        } else {
            showMessage(data.message || 'Login failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const userName = document.getElementById('registerUserName').value.trim();
    const userId = document.getElementById('registerUserId').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!userName || !userId || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    showLoading(true);
    clearMessages();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_name: userName,
                user_id: userId,
                user_password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showMessage('Registration successful! You can now login.', 'success');
            
            // Switch to login form and pre-fill user ID
            toggleForm();
            document.getElementById('loginUserId').value = userId;
            
            // Show e-signature information
            setTimeout(() => {
                showMessage(`Your e-signature: ${data.user.e_signature.substring(0, 20)}...`, 'success');
            }, 2000);
            
        } else {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Token is valid, redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const forms = document.querySelectorAll('.form-container');
    
    if (show) {
        loading.style.display = 'block';
        forms.forEach(form => form.style.display = 'none');
    } else {
        loading.style.display = 'none';
        forms.forEach(form => {
            if ((currentForm === 'login' && form.id === 'login-form') ||
                (currentForm === 'register' && form.id === 'register-form')) {
                form.style.display = 'block';
            }
        });
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function clearMessages() {
    const messageDiv = document.getElementById('message');
    messageDiv.style.display = 'none';
    messageDiv.textContent = '';
    messageDiv.className = 'message';
}

// Demo user quick login functions
function quickLogin(userId, password) {
    document.getElementById('loginUserId').value = userId;
    document.getElementById('loginPassword').value = password;
    
    // Ensure we're on the login form
    if (currentForm !== 'login') {
        toggleForm();
    }
    
    showMessage(`Demo credentials filled for ${userId}`, 'success');
}

// Add click handlers to demo users
document.addEventListener('DOMContentLoaded', function() {
    const demoUsers = document.querySelectorAll('.demo-user');
    demoUsers.forEach((user, index) => {
        const credentials = [
            { userId: 'alice001', password: 'password123' },
            { userId: 'bob002', password: 'securepass' },
            { userId: 'charlie003', password: 'mypassword' },
            { userId: 'diana004', password: 'strongpass' }
        ];
        
        if (credentials[index]) {
            user.style.cursor = 'pointer';
            user.addEventListener('click', () => {
                quickLogin(credentials[index].userId, credentials[index].password);
            });
        }
    });
}); 