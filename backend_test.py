import requests
import unittest
import json
import uuid
from datetime import datetime, timedelta

class LabJournalAPITest(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://97e456da-068a-40b2-be4b-b782e0702ff1.preview.emergentagent.com/api"
        self.admin_email = "admin@lab.com"
        self.admin_password = "admin123"
        self.test_user_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "Test123!"
        self.token = None
        self.admin_token = None
        self.test_chemical_id = None

    def test_01_register_user(self):
        """Test user registration"""
        print(f"\n🔍 Testing user registration with {self.test_user_email}...")
        
        response = requests.post(
            f"{self.base_url}/auth/register",
            json={"email": self.test_user_email, "password": self.test_user_password}
        )
        
        self.assertEqual(response.status_code, 201, f"Registration failed: {response.text}")
        print(f"✅ User registration successful")

    def test_02_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n🔍 Testing login with invalid credentials...")
        
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": self.test_user_email, "password": "wrongpassword"}
        )
        
        self.assertEqual(response.status_code, 401, f"Expected 401, got {response.status_code}")
        print(f"✅ Login with invalid credentials correctly rejected")

    def test_03_login_with_valid_credentials(self):
        """Test login with valid credentials"""
        print("\n🔍 Testing login with valid credentials...")
        
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": self.test_user_email, "password": self.test_user_password}
        )
        
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "No access token in response")
        self.token = data["access_token"]
        print(f"✅ Login successful, token received")

    def test_04_login_as_admin(self):
        """Test login as admin"""
        print("\n🔍 Testing login as admin...")
        
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": self.admin_email, "password": self.admin_password}
        )
        
        self.assertEqual(response.status_code, 200, f"Admin login failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "No access token in response")
        self.admin_token = data["access_token"]
        print(f"✅ Admin login successful, token received")

    def test_05_get_current_user(self):
        """Test getting current user info"""
        print("\n🔍 Testing get current user info...")
        
        if not self.token:
            self.skipTest("No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Get user info failed: {response.text}")
        data = response.json()
        self.assertEqual(data["email"], self.test_user_email)
        self.assertEqual(data["role"], "guest", "New user should have guest role by default")
        print(f"✅ User info retrieved successfully")

    def test_06_access_dashboard_stats(self):
        """Test accessing dashboard stats"""
        print("\n🔍 Testing dashboard stats access...")
        
        if not self.token:
            self.skipTest("No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/dashboard/stats", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Dashboard stats access failed: {response.text}")
        data = response.json()
        self.assertIn("total_chemicals", data)
        self.assertIn("low_stock_count", data)
        self.assertIn("expiring_soon_count", data)
        self.assertIn("recent_additions", data)
        print(f"✅ Dashboard stats accessed successfully")

    def test_07_add_chemical(self):
        """Test adding a new chemical"""
        print("\n🔍 Testing adding a new chemical...")
        
        if not self.admin_token:
            self.skipTest("No admin token available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        chemical_data = {
            "name": "Test Chemical",
            "quantity": 100,
            "unit": "g",
            "unit_type": "weight",
            "location": "Lab A",
            "safety_data": "Handle with care",
            "supplier": "Test Supplier",
            "notes": "Test notes",
            "low_stock_alert": True,
            "low_stock_threshold": 20,
            "expiration_date": (datetime.now() + timedelta(days=90)).isoformat()
        }
        
        response = requests.post(
            f"{self.base_url}/chemicals",
            json=chemical_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 201, f"Add chemical failed: {response.text}")
        data = response.json()
        self.assertIn("id", data)
        self.test_chemical_id = data["id"]
        print(f"✅ Chemical added successfully with ID: {self.test_chemical_id}")

    def test_08_get_chemicals(self):
        """Test getting all chemicals"""
        print("\n🔍 Testing getting all chemicals...")
        
        if not self.token:
            self.skipTest("No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/chemicals", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Get chemicals failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list)
        print(f"✅ Retrieved {len(data)} chemicals successfully")

    def test_09_get_chemical_by_id(self):
        """Test getting a chemical by ID"""
        print("\n🔍 Testing getting a chemical by ID...")
        
        if not self.token or not self.test_chemical_id:
            self.skipTest("No token or chemical ID available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(f"{self.base_url}/chemicals/{self.test_chemical_id}", headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Get chemical by ID failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], "Test Chemical")
        print(f"✅ Retrieved chemical by ID successfully")

    def test_10_search_chemicals(self):
        """Test searching chemicals"""
        print("\n🔍 Testing searching chemicals...")
        
        if not self.token:
            self.skipTest("No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/chemicals?search=Test",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Search chemicals failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertTrue(any("Test" in chemical["name"] for chemical in data))
        print(f"✅ Chemical search successful")

    def test_11_update_chemical(self):
        """Test updating a chemical"""
        print("\n🔍 Testing updating a chemical...")
        
        if not self.admin_token or not self.test_chemical_id:
            self.skipTest("No admin token or chemical ID available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        update_data = {
            "name": "Updated Test Chemical",
            "quantity": 80,
            "unit": "g",
            "unit_type": "weight",
            "location": "Lab B",
            "safety_data": "Updated safety data",
            "supplier": "Updated Supplier",
            "notes": "Updated notes",
            "low_stock_alert": True,
            "low_stock_threshold": 15
        }
        
        response = requests.put(
            f"{self.base_url}/chemicals/{self.test_chemical_id}",
            json=update_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200, f"Update chemical failed: {response.text}")
        print(f"✅ Chemical updated successfully")

    def test_12_guest_cannot_add_chemical(self):
        """Test that guest users cannot add chemicals"""
        print("\n🔍 Testing that guest users cannot add chemicals...")
        
        if not self.token:
            self.skipTest("No token available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        chemical_data = {
            "name": "Guest Test Chemical",
            "quantity": 50,
            "unit": "ml",
            "unit_type": "volume",
            "location": "Lab C"
        }
        
        response = requests.post(
            f"{self.base_url}/chemicals",
            json=chemical_data,
            headers=headers
        )
        
        self.assertEqual(response.status_code, 403, f"Expected 403, got {response.status_code}")
        print(f"✅ Guest user correctly prevented from adding chemicals")

    def test_13_delete_chemical(self):
        """Test deleting a chemical"""
        print("\n🔍 Testing deleting a chemical...")
        
        if not self.admin_token or not self.test_chemical_id:
            self.skipTest("No admin token or chemical ID available")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.delete(
            f"{self.base_url}/chemicals/{self.test_chemical_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 204, f"Delete chemical failed: {response.status_code}")
        print(f"✅ Chemical deleted successfully")

    def test_14_verify_deletion(self):
        """Verify that the chemical was deleted"""
        print("\n🔍 Verifying chemical deletion...")
        
        if not self.token or not self.test_chemical_id:
            self.skipTest("No token or chemical ID available")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        response = requests.get(
            f"{self.base_url}/chemicals/{self.test_chemical_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404, f"Expected 404, got {response.status_code}")
        print(f"✅ Chemical deletion verified")

if __name__ == "__main__":
    # Run the tests in order
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
