def test_user_registration(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@nexus.ai",
        "password": "strongpassword123",
        "full_name": "New SDR Rep"
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@nexus.ai"

def test_user_login(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "tester@nexus.ai",
        "password": "testpass123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tester@nexus.ai"

def test_user_login_invalid_credentials(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "tester@nexus.ai",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
