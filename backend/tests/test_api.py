from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert "status" in body
    assert "version" in body


def test_optimize_endpoint():
    req = {
        "total_amount": 1000000000000000000000,  # 1000 ETH in wei
        "strategies": [
            {"strategy_id": 1, "weight": 0.3},
            {"strategy_id": 2, "weight": 0.7}
        ]
    }
    resp = client.post("/api/v1/yield/optimize", json=req)
    assert resp.status_code == 200
    body = resp.json()
    assert "optimal_allocations" in body




