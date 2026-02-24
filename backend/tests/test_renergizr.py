"""
Renergizr B2B Energy Trading Platform - Backend API Tests
Tests: auth, RFQs, bids, vendor profile, admin, market insights
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

CLIENT_EMAIL = "buyer1@acme.com"
CLIENT_PASS = "Client@123"
VENDOR_EMAIL = "vendor1@greensun.com"
VENDOR_PASS = "Vendor@123"
ADMIN_EMAIL = "admin@renergizr.com"
ADMIN_PASS = "Admin@123"


@pytest.fixture(scope="module")
def client_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS})
    assert r.status_code == 200, f"Client login failed: {r.text}"
    token = r.json().get("session_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s

@pytest.fixture(scope="module")
def vendor_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": VENDOR_EMAIL, "password": VENDOR_PASS})
    assert r.status_code == 200, f"Vendor login failed: {r.text}"
    token = r.json().get("session_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s

@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    token = r.json().get("session_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# Auth Tests
class TestAuth:
    def test_client_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": CLIENT_EMAIL, "password": CLIENT_PASS})
        assert r.status_code == 200
        data = r.json()
        assert "session_token" in data
        assert data["user"]["role"] == "client"

    def test_vendor_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": VENDOR_EMAIL, "password": VENDOR_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "vendor"

    def test_admin_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "admin"

    def test_invalid_login(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "bad@bad.com", "password": "wrong"})
        assert r.status_code in [401, 400]

    def test_me_endpoint(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == CLIENT_EMAIL


# Market Insights (requires auth)
class TestMarketInsights:
    def test_market_insights_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/market/insights")
        assert r.status_code == 401

    def test_market_insights_with_auth(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/market/insights")
        assert r.status_code == 200
        data = r.json()
        assert "energy_prices" in data
        assert "carbon" in data

    def test_market_insights_structure(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/market/insights")
        data = r.json()
        assert "price_history" in data
        assert len(data["price_history"]) > 0


# RFQ Tests
class TestRFQs:
    def test_create_rfq(self, client_session):
        payload = {
            "title": "TEST_Solar Energy Supply",
            "description": "Solar energy supply for testing",
            "energy_type": "solar",
            "quantity_mw": 500,
            "delivery_location": "Texas",
            "start_date": "2026-04-01",
            "end_date": "2026-09-30"
        }
        r = client_session.post(f"{BASE_URL}/api/rfqs", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Solar Energy Supply"
        assert "rfq_id" in data

    def test_get_rfqs_as_client(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/rfqs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_rfqs_as_vendor(self, vendor_session):
        r = vendor_session.get(f"{BASE_URL}/api/rfqs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# Vendor Tests
class TestVendor:
    def test_vendor_profile_get(self, vendor_session):
        r = vendor_session.get(f"{BASE_URL}/api/vendor/profile")
        assert r.status_code == 200
        data = r.json()
        assert "company_name" in data or "email" in data

    def test_vendor_bids(self, vendor_session):
        r = vendor_session.get(f"{BASE_URL}/api/vendor/bids")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_vendor_profile_update(self, vendor_session):
        r = vendor_session.put(f"{BASE_URL}/api/vendor/profile", json={"company_description": "TEST_Green Energy Provider"})
        assert r.status_code == 200


# Admin Tests
class TestAdmin:
    def test_admin_get_users(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/users")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_get_vendors(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/vendors")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_analytics(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/analytics")
        assert r.status_code == 200
        data = r.json()
        assert "total_rfqs" in data or len(data) > 0

    def test_admin_rfqs(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/rfqs")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# Notifications
class TestNotifications:
    def test_notifications_endpoint(self, client_session):
        r = client_session.get(f"{BASE_URL}/api/notifications")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
