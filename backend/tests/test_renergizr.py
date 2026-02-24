"""Backend tests for Renergizr B2B Energy Trading Platform"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@renergizr.com"
ADMIN_PASS = "Admin@123"
CLIENT_EMAIL = "buyer1@acme.com"
CLIENT_PASS = "Client@123"
VENDOR_EMAIL = "vendor1@greensun.com"
VENDOR_PASS = "Vendor@123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if r.status_code == 200:
        return r.json()["session_token"]
    pytest.skip("Admin auth failed")

@pytest.fixture(scope="module")
def client_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS})
    if r.status_code == 200:
        return r.json()["session_token"]
    pytest.skip("Client auth failed")

@pytest.fixture(scope="module")
def vendor_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": VENDOR_EMAIL, "password": VENDOR_PASS})
    if r.status_code == 200:
        return r.json()["session_token"]
    pytest.skip("Vendor auth failed")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# Auth tests
class TestAuth:
    """Auth endpoint tests"""

    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        assert r.status_code == 200
        data = r.json()
        assert "user" in data
        assert "session_token" in data
        assert data["user"]["role"] == "admin"

    def test_client_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "client"

    def test_vendor_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": VENDOR_EMAIL, "password": VENDOR_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "vendor"

    def test_invalid_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
        assert r.status_code == 401

    def test_get_me(self, client_token=None):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS})
        token = r.json()["session_token"]
        me = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(token))
        assert me.status_code == 200
        assert me.json()["email"] == CLIENT_EMAIL

    def test_register_new_client(self):
        import uuid
        email = f"TEST_client_{uuid.uuid4().hex[:6]}@test.com"
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "Test@123",
            "name": "Test Client",
            "role": "client",
            "company": "TestCo"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "client"


# RFQ tests
class TestRFQs:
    """RFQ endpoint tests"""

    def test_list_rfqs_client(self, client_token):
        r = requests.get(f"{BASE_URL}/api/rfqs", headers=auth_headers(client_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_list_rfqs_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/rfqs")
        assert r.status_code == 401

    def test_create_rfq(self, client_token):
        r = requests.post(f"{BASE_URL}/api/rfqs", headers=auth_headers(client_token), json={
            "title": "TEST_RFQ Solar Supply",
            "description": "Test RFQ for solar energy",
            "energy_type": "solar",
            "quantity_mw": 50.0,
            "delivery_location": "Texas, USA",
            "start_date": "2026-06-01",
            "end_date": "2026-12-31",
            "price_ceiling": 100.0
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_RFQ Solar Supply"
        assert data["status"] == "open"
        assert "rfq_id" in data
        return data["rfq_id"]

    def test_get_rfq(self, client_token):
        # Create then get
        create_r = requests.post(f"{BASE_URL}/api/rfqs", headers=auth_headers(client_token), json={
            "title": "TEST_Get RFQ",
            "description": "Test",
            "energy_type": "wind",
            "quantity_mw": 10.0,
            "delivery_location": "NYC",
            "start_date": "2026-01-01",
            "end_date": "2026-06-01"
        })
        assert create_r.status_code == 200
        rfq_id = create_r.json()["rfq_id"]
        r = requests.get(f"{BASE_URL}/api/rfqs/{rfq_id}", headers=auth_headers(client_token))
        assert r.status_code == 200
        assert r.json()["rfq_id"] == rfq_id

    def test_vendor_sees_open_rfqs(self, vendor_token):
        r = requests.get(f"{BASE_URL}/api/rfqs", headers=auth_headers(vendor_token))
        assert r.status_code == 200
        rfqs = r.json()
        # All should be open status for vendor
        for rfq in rfqs:
            assert rfq["status"] == "open"


# Vendor tests
class TestVendor:
    """Vendor profile and bid tests"""

    def test_get_vendor_profile(self, vendor_token):
        r = requests.get(f"{BASE_URL}/api/vendor/profile", headers=auth_headers(vendor_token))
        assert r.status_code == 200
        data = r.json()
        assert "company_name" in data
        assert "vendor_id" in data

    def test_get_vendor_bids(self, vendor_token):
        r = requests.get(f"{BASE_URL}/api/vendor/bids", headers=auth_headers(vendor_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_vendor_profile_client_forbidden(self, client_token):
        r = requests.get(f"{BASE_URL}/api/vendor/profile", headers=auth_headers(client_token))
        assert r.status_code == 404  # client has no vendor profile


# Admin tests
class TestAdmin:
    """Admin endpoint tests"""

    def test_admin_analytics(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=auth_headers(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "total_users" in data
        assert "total_rfqs" in data
        assert "total_bids" in data

    def test_admin_list_users(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_list_vendors(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/vendors", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_list_rfqs(self, admin_token):
        r = requests.get(f"{BASE_URL}/api/admin/rfqs", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_non_admin_blocked(self, client_token):
        r = requests.get(f"{BASE_URL}/api/admin/analytics", headers=auth_headers(client_token))
        assert r.status_code == 403
