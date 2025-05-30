#!/usr/bin/env python3
import requests
import json
import jwt
import sys
from datetime import datetime, timedelta

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# API endpoint for login
LOGIN_URL = f"{BACKEND_URL}/api/auth/login"
ME_URL = f"{BACKEND_URL}/api/auth/me"
ROOT_URL = f"{BACKEND_URL}/api"

# Admin credentials
ADMIN_EMAIL = "admin@lab.com"
ADMIN_PASSWORD = "admin123"

# Test colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ {message}{RESET}")

def test_login_authentication():
    print_info("\n=== Testing Login Authentication ===")
    
    # Test 1: API Root
    print_info("Testing API root endpoint...")
    try:
        response = requests.get(ROOT_URL)
        if response.status_code == 200:
            print_success(f"API root endpoint is accessible: {response.json()}")
        else:
            print_error(f"API root endpoint returned status code {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error accessing API root endpoint: {str(e)}")
        return False
    
    # Test 2: Login with admin credentials
    print_info("Testing login with admin credentials...")
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        response = requests.post(LOGIN_URL, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print_success("Login successful, received JWT token")
                print_info(f"Token: {token[:30]}...")
                
                # Decode token without verification to see structure
                try:
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    print_success(f"Token payload: {json.dumps(decoded, indent=2)}")
                    
                    # Check expiration
                    if 'exp' in decoded:
                        exp_time = datetime.fromtimestamp(decoded['exp'])
                        now = datetime.utcnow()
                        time_left = exp_time - now
                        print_success(f"Token expires at: {exp_time} (in {time_left})")
                    
                    # Check user ID
                    if 'sub' in decoded:
                        print_success(f"User ID in token: {decoded['sub']}")
                    else:
                        print_error("Token does not contain user ID ('sub' claim)")
                except Exception as e:
                    print_error(f"Error decoding token: {str(e)}")
            else:
                print_error("Login response did not contain a token")
                print_error(f"Response: {data}")
                return False
        else:
            print_error(f"Login failed with status code {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error during login: {str(e)}")
        return False
    
    # Test 3: Validate token with /me endpoint
    print_info("Testing token validation with /api/auth/me endpoint...")
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        response = requests.get(ME_URL, headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            print_success(f"Token is valid. User info: {user_data}")
        else:
            print_error(f"Token validation failed with status code {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error during token validation: {str(e)}")
        return False
    
    # Test 4: Login with incorrect password
    print_info("Testing login with incorrect password...")
    try:
        payload = {
            "email": ADMIN_EMAIL,
            "password": "wrong_password"
        }
        response = requests.post(LOGIN_URL, json=payload)
        
        if response.status_code == 401:
            print_success("Login correctly rejected with invalid password")
        else:
            print_error(f"Expected 401 status code, got {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error during login with incorrect password: {str(e)}")
        return False
    
    # Test 5: Login with non-existent user
    print_info("Testing login with non-existent user...")
    try:
        payload = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        response = requests.post(LOGIN_URL, json=payload)
        
        if response.status_code == 401:
            print_success("Login correctly rejected non-existent user")
        else:
            print_error(f"Expected 401 status code, got {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error during login with non-existent user: {str(e)}")
        return False
    
    # Test 6: Access protected endpoint without token
    print_info("Testing access to protected endpoint without token...")
    try:
        response = requests.get(ME_URL)
        
        if response.status_code in [401, 403]:
            print_success("Protected endpoint correctly rejected unauthenticated request")
        else:
            print_error(f"Expected 401/403 status code, got {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error accessing protected endpoint without token: {str(e)}")
        return False
    
    # Test 7: Access protected endpoint with invalid token
    print_info("Testing access to protected endpoint with invalid token...")
    try:
        headers = {
            "Authorization": "Bearer invalid.token.here"
        }
        response = requests.get(ME_URL, headers=headers)
        
        if response.status_code in [401, 403]:
            print_success("Protected endpoint correctly rejected invalid token")
        else:
            print_error(f"Expected 401/403 status code, got {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error accessing protected endpoint with invalid token: {str(e)}")
        return False
    
    print_success("\nAll login authentication tests passed successfully!")
    return True

if __name__ == "__main__":
    success = test_login_authentication()
    sys.exit(0 if success else 1)