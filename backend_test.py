import requests
import sys
import uuid
from datetime import datetime, timedelta

class LabJournalAPITester:
    def __init__(self):
        self.base_url = "https://97e456da-068a-40b2-be4b-b782e0702ff1.preview.emergentagent.com/api"
        self.admin_email = "admin@lab.com"
        self.admin_password = "admin123"
        self.test_user_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "Test123!"
        self.token = None
        self.admin_token = None
        self.test_chemical_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            # For creation endpoints, accept both 200 and 201
            if method == 'POST' and expected_status == 201 and response.status_code == 200:
                success = True
            else:
                success = response.status_code == expected_status
                
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # No content
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                self.tests_failed += 1
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            self.tests_failed += 1
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_user(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            201,  # Will also accept 200
            data={"email": self.test_user_email, "password": self.test_user_password}
        )
        if success:
            print(f"User registered: {response.get('email')}")
            print(f"User role: {response.get('role')}")
        return success

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Login with Invalid Credentials",
            "POST",
            "auth/login",
            401,
            data={"email": self.test_user_email, "password": "wrongpassword"}
        )
        return success

    def test_login_with_valid_credentials(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login with Valid Credentials",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_user_email, "password": self.test_user_password}
        )
        if success and "access_token" in response:
            self.token = response["access_token"]
            print(f"Token received: {self.token[:20]}...")
        return success

    def test_login_as_admin(self):
        """Test login as admin"""
        success, response = self.run_test(
            "Login as Admin",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success and "access_token" in response:
            self.admin_token = response["access_token"]
            print(f"Admin token received: {self.admin_token[:20]}...")
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200,
            token=self.token
        )
        if success:
            print(f"User email: {response.get('email')}")
            print(f"User role: {response.get('role')}")
        return success

    def test_access_dashboard_stats(self):
        """Test accessing dashboard stats"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Dashboard Stats Access",
            "GET",
            "dashboard/stats",
            200,
            token=self.token
        )
        if success:
            print(f"Total chemicals: {response.get('total_chemicals')}")
            print(f"Low stock count: {response.get('low_stock_count')}")
            print(f"Expiring soon count: {response.get('expiring_soon_count')}")
            print(f"Recent additions count: {response.get('recent_additions')}")
        return success

    def test_add_chemical(self):
        """Test adding a new chemical"""
        if not self.admin_token:
            print("⚠️ Skipping test: No admin token available")
            return False
        
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
        
        success, response = self.run_test(
            "Add Chemical",
            "POST",
            "chemicals",
            201,  # Will also accept 200
            data=chemical_data,
            token=self.admin_token
        )
        if success and "id" in response:
            self.test_chemical_id = response["id"]
            print(f"Chemical ID: {self.test_chemical_id}")
        return success

    def test_get_chemicals(self):
        """Test getting all chemicals"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Get All Chemicals",
            "GET",
            "chemicals",
            200,
            token=self.token
        )
        if success:
            print(f"Retrieved {len(response)} chemicals")
            if response:
                print(f"First chemical: {response[0].get('name')}")
        return success

    def test_get_chemical_by_id(self):
        """Test getting a chemical by ID"""
        if not self.token or not self.test_chemical_id:
            print("⚠️ Skipping test: No token or chemical ID available")
            return False
        
        success, response = self.run_test(
            "Get Chemical by ID",
            "GET",
            f"chemicals/{self.test_chemical_id}",
            200,
            token=self.token
        )
        if success:
            print(f"Chemical name: {response.get('name')}")
            print(f"Chemical quantity: {response.get('quantity')} {response.get('unit')}")
        return success

    def test_search_chemicals(self):
        """Test searching chemicals"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Search Chemicals",
            "GET",
            "chemicals",
            200,
            token=self.token,
            params={"search": "Test"}
        )
        if success:
            print(f"Found {len(response)} chemicals matching 'Test'")
        return success

    def test_update_chemical(self):
        """Test updating a chemical"""
        if not self.admin_token or not self.test_chemical_id:
            print("⚠️ Skipping test: No admin token or chemical ID available")
            return False
        
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
        
        success, response = self.run_test(
            "Update Chemical",
            "PUT",
            f"chemicals/{self.test_chemical_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        if success:
            print(f"Chemical updated: {response.get('name')}")
        return success

    def test_guest_cannot_add_chemical(self):
        """Test that guest users cannot add chemicals"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        chemical_data = {
            "name": "Guest Test Chemical",
            "quantity": 50,
            "unit": "ml",
            "unit_type": "volume",
            "location": "Lab C"
        }
        
        success, _ = self.run_test(
            "Guest User Cannot Add Chemical",
            "POST",
            "chemicals",
            403,
            data=chemical_data,
            token=self.token
        )
        return success

    def test_delete_chemical(self):
        """Test deleting a chemical"""
        if not self.admin_token or not self.test_chemical_id:
            print("⚠️ Skipping test: No admin token or chemical ID available")
            return False
        
        success, _ = self.run_test(
            "Delete Chemical",
            "DELETE",
            f"chemicals/{self.test_chemical_id}",
            204,
            token=self.admin_token
        )
        return success

    def test_verify_deletion(self):
        """Verify that the chemical was deleted"""
        if not self.token or not self.test_chemical_id:
            print("⚠️ Skipping test: No token or chemical ID available")
            return False
        
        success, _ = self.run_test(
            "Verify Chemical Deletion",
            "GET",
            f"chemicals/{self.test_chemical_id}",
            404,
            token=self.token
        )
        return success

    def test_create_experiment(self):
        """Test creating a new experiment"""
        if not self.admin_token:
            print("⚠️ Skipping test: No admin token available")
            return False
        
        experiment_data = {
            "title": "pH Buffer Preparation",
            "date": datetime.now().isoformat(),
            "description": "Testing the preparation of pH buffer solutions",
            "procedure": "1. Prepare solutions\n2. Mix in correct ratios\n3. Verify pH with meter",
            "chemicals_used": [],
            "equipment_used": ["pH meter", "Beakers", "Magnetic stirrer"],
            "observations": "Solution turned clear after mixing",
            "results": "pH measured at 7.2, within expected range",
            "conclusions": "Buffer preparation successful",
            "external_links": ["https://example.com/buffer-protocol"]
        }
        
        # If we have a chemical ID, add it to the experiment
        if self.test_chemical_id:
            experiment_data["chemicals_used"] = [
                {
                    "chemical_id": self.test_chemical_id,
                    "chemical_name": "Test Chemical",
                    "quantity_used": 10.5,
                    "unit": "g",
                    "available_quantity": 100
                }
            ]
        
        success, response = self.run_test(
            "Create Experiment",
            "POST",
            "experiments",
            201,  # Will also accept 200
            data=experiment_data,
            token=self.admin_token
        )
        
        if success and "id" in response:
            self.test_experiment_id = response["id"]
            print(f"Experiment ID: {self.test_experiment_id}")
        return success
    
    def test_get_experiments(self):
        """Test getting all experiments"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Get All Experiments",
            "GET",
            "experiments",
            200,
            token=self.token
        )
        
        if success:
            print(f"Retrieved {len(response)} experiments")
            if response:
                print(f"First experiment: {response[0].get('title')}")
        return success
    
    def test_get_experiment_by_id(self):
        """Test getting an experiment by ID"""
        if not self.token or not hasattr(self, 'test_experiment_id'):
            print("⚠️ Skipping test: No token or experiment ID available")
            return False
        
        success, response = self.run_test(
            "Get Experiment by ID",
            "GET",
            f"experiments/{self.test_experiment_id}",
            200,
            token=self.token
        )
        
        if success:
            print(f"Experiment title: {response.get('title')}")
            print(f"Experiment status: {'Completed' if response.get('results') else 'In Progress'}")
        return success
    
    def test_search_experiments(self):
        """Test searching experiments"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Search Experiments",
            "GET",
            "experiments",
            200,
            token=self.token,
            params={"search": "Buffer"}
        )
        
        if success:
            print(f"Found {len(response)} experiments matching 'Buffer'")
        return success
    
    def test_filter_experiments_by_date(self):
        """Test filtering experiments by date range"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
        
        success, response = self.run_test(
            "Filter Experiments by Date",
            "GET",
            "experiments",
            200,
            token=self.token,
            params={"date_from": yesterday, "date_to": tomorrow}
        )
        
        if success:
            print(f"Found {len(response)} experiments in date range")
        return success
    
    def test_update_experiment(self):
        """Test updating an experiment"""
        if not self.admin_token or not hasattr(self, 'test_experiment_id'):
            print("⚠️ Skipping test: No admin token or experiment ID available")
            return False
        
        update_data = {
            "title": "Updated pH Buffer Preparation",
            "results": "pH measured at 7.4, within expected range. Experiment completed.",
            "conclusions": "Buffer preparation successful with improved accuracy"
        }
        
        success, response = self.run_test(
            "Update Experiment",
            "PUT",
            f"experiments/{self.test_experiment_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        
        if success:
            print(f"Experiment updated: {response.get('title')}")
        return success
    
    def test_get_available_chemicals(self):
        """Test getting available chemicals for experiments"""
        if not self.token:
            print("⚠️ Skipping test: No token available")
            return False
        
        success, response = self.run_test(
            "Get Available Chemicals for Experiments",
            "GET",
            "experiments/chemicals/available",
            200,
            token=self.token
        )
        
        if success:
            print(f"Retrieved {len(response)} available chemicals")
        return success
    
    def test_delete_experiment(self):
        """Test deleting an experiment"""
        if not self.admin_token or not hasattr(self, 'test_experiment_id'):
            print("⚠️ Skipping test: No admin token or experiment ID available")
            return False
        
        success, _ = self.run_test(
            "Delete Experiment",
            "DELETE",
            f"experiments/{self.test_experiment_id}",
            200,  # Some APIs use 204, others 200
            token=self.admin_token
        )
        return success
    
    def test_verify_experiment_deletion(self):
        """Verify that the experiment was deleted"""
        if not self.token or not hasattr(self, 'test_experiment_id'):
            print("⚠️ Skipping test: No token or experiment ID available")
            return False
        
        success, _ = self.run_test(
            "Verify Experiment Deletion",
            "GET",
            f"experiments/{self.test_experiment_id}",
            404,
            token=self.token
        )
        return success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        tests = [
            self.test_register_user,
            self.test_login_with_invalid_credentials,
            self.test_login_with_valid_credentials,
            self.test_login_as_admin,
            self.test_get_current_user,
            self.test_access_dashboard_stats,
            self.test_add_chemical,
            self.test_get_chemicals,
            self.test_get_chemical_by_id,
            self.test_search_chemicals,
            self.test_update_chemical,
            self.test_guest_cannot_add_chemical,
            self.test_create_experiment,
            self.test_get_experiments,
            self.test_get_experiment_by_id,
            self.test_search_experiments,
            self.test_filter_experiments_by_date,
            self.test_update_experiment,
            self.test_get_available_chemicals,
            self.test_delete_experiment,
            self.test_verify_experiment_deletion,
            self.test_delete_chemical,
            self.test_verify_deletion
        ]
        
        for test in tests:
            test()
        
        print("\n📊 Test Results:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_failed}")
        
        return self.tests_failed == 0

def main():
    tester = LabJournalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
