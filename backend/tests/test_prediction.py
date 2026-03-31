# File: backend/tests/test_prediction.py
"""Unit and integration tests for prediction endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.services.ml_service import ResistancePredictor, LABEL_REVERSE


# ─── ML Service Unit Tests ────────────────────────────────────────────────────

class TestResistancePredictor:
    def setup_method(self):
        self.predictor = ResistancePredictor(model_dir="/tmp/test_models")

    def test_predict_returns_expected_keys(self):
        features = {f"MIC_{ab}": 2.0 for ab in ["Amoxicillin", "Ciprofloxacin"]}
        result = self.predictor.predict(features, "Ciprofloxacin")
        assert "prediction" in result
        assert "confidence" in result
        assert "probability_resistant" in result
        assert "probability_susceptible" in result
        assert "probability_intermediate" in result
        assert "feature_importance" in result
        assert "treatment_suggestions" in result

    def test_prediction_label_is_valid(self):
        result = self.predictor.predict({}, "Amoxicillin")
        assert result["prediction"] in ("Resistant", "Susceptible", "Intermediate")

    def test_probabilities_sum_to_one(self):
        result = self.predictor.predict({}, "Vancomycin")
        total = (
            result["probability_resistant"]
            + result["probability_susceptible"]
            + result["probability_intermediate"]
        )
        assert abs(total - 1.0) < 1e-4

    def test_confidence_in_range(self):
        result = self.predictor.predict({}, "Tetracycline")
        assert 0.0 <= result["confidence"] <= 1.0

    def test_treatment_suggestions_non_empty(self):
        result = self.predictor.predict({}, "Amoxicillin")
        assert len(result["treatment_suggestions"]) >= 1

    def test_feature_vector_fills_missing(self):
        vec = self.predictor._build_feature_vector({"MIC_Amoxicillin": 4.0})
        assert len(vec) == len(self.predictor.feature_names)
        assert isinstance(vec[0], float)

    def test_model_metrics_returned(self):
        metrics = self.predictor.get_model_metrics()
        assert "cv_f1_macro" in metrics
        assert "roc_auc_macro" in metrics


# ─── API Integration Tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_predict_single():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/v1/predict/single",
            json={
                "bacterial_species": "E. coli",
                "antibiotic": "Ciprofloxacin",
                "features": {"MIC_Ciprofloxacin": 8.0, "gene_blaTEM": 1},
            },
        )
    assert r.status_code == 200
    data = r.json()
    assert data["prediction"] in ("Resistant", "Susceptible", "Intermediate")
    assert 0.0 <= data["confidence"] <= 1.0
    assert "treatment_suggestions" in data


@pytest.mark.asyncio
async def test_predict_batch():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post(
            "/api/v1/predict/batch",
            json={
                "isolates": [
                    {"bacterial_species": "S. aureus", "antibiotic": "Vancomycin", "features": {}},
                    {"bacterial_species": "K. pneumoniae", "antibiotic": "Meropenem", "features": {"MIC_Meropenem": 2.0}},
                ]
            },
        )
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert "summary" in data


@pytest.mark.asyncio
async def test_antibiotics_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/predict/antibiotics")
    assert r.status_code == 200
    assert len(r.json()["antibiotics"]) > 0


@pytest.mark.asyncio
async def test_gene_network():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/genes/network")
    assert r.status_code == 200
    data = r.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) > 0


@pytest.mark.asyncio
async def test_resistance_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/v1/analysis/resistance-stats")
    assert r.status_code == 200
    assert len(r.json()["data"]) > 0


@pytest.mark.asyncio
async def test_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@resistai.dev",
                "username": "testuser",
                "password": "SecurePass123",
                "full_name": "Test User",
            },
        )
        assert reg.status_code in (201, 409)

        login = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@resistai.dev", "password": "SecurePass123"},
        )
        if login.status_code == 200:
            assert "access_token" in login.json()
