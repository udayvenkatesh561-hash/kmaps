from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_examples_endpoint():
    response = client.get("/api/examples")
    assert response.status_code == 200
    examples = response.json()
    assert isinstance(examples, list)
    assert len(examples) >= 4

def test_solve_endpoint():
    payload = {
        "variables": 4,
        "minterms": [0, 1, 2, 5, 7],
        "dont_cares": [3],
        "mode": "SOP"
    }
    response = client.post("/api/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "expression_sop" in data
    assert "groups" in data
    assert "truth_table" in data
    assert "kmap_grid" in data
    assert data["sympy_verified"] == True
