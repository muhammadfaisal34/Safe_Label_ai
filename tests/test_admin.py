from fastapi.testclient import TestClient

from app.backend.app.main import app

client = TestClient(app)


def test_admin_requires_auth():
    response = client.get("/admin/stats")
    assert response.status_code == 401


def test_admin_flow():
    # 1. Login
    login_res = client.post("/auth/login", json={"email": "admin@safelabelai.com", "password": "admin123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Stats
    stats_res = client.get("/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "users" in stats
    assert "products" in stats
    assert "scans" in stats
    assert "detections" in stats

    # 3. Users list
    users_res = client.get("/admin/users", headers=headers)
    assert users_res.status_code == 200
    assert isinstance(users_res.json(), list)

    # 4. Products list
    products_res = client.get("/admin/products", headers=headers)
    assert products_res.status_code == 200
    assert isinstance(products_res.json(), list)

    # 5. Scans list
    scans_res = client.get("/admin/scans", headers=headers)
    assert scans_res.status_code == 200
    assert isinstance(scans_res.json(), list)

    # 6. Allergens list
    allergens_res = client.get("/admin/allergens", headers=headers)
    assert allergens_res.status_code == 200
    assert isinstance(allergens_res.json(), list)

    # 7. Reports
    reports_res = client.get("/admin/reports", headers=headers)
    assert reports_res.status_code == 200
    assert "total_scans" in reports_res.json()

    # 8. Logs
    logs_res = client.get("/admin/logs", headers=headers)
    assert logs_res.status_code == 200
    assert isinstance(logs_res.json(), list)

    # 9. Current user
    me_res = client.get("/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@safelabelai.com"
