# File: backend/src/models/schemas.py
"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Prediction ────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    """Input for single antibiotic resistance prediction."""
    bacterial_species: str = Field(..., description="Bacterial species name")
    antibiotic: str = Field(..., description="Antibiotic to test resistance against")
    features: Dict[str, Any] = Field(
        ...,
        description="Feature dictionary: can include MIC breakpoints, zone diameters, or genomic markers",
    )

    @field_validator("bacterial_species")
    @classmethod
    def validate_species(cls, v: str) -> str:
        return v.strip().title()


class BatchPredictionInput(BaseModel):
    """Batch input for multiple isolates."""
    isolates: List[PredictionInput] = Field(..., min_length=1, max_length=100)


class FeatureImportance(BaseModel):
    feature: str
    shap_value: float
    direction: str  # positive | negative


class TreatmentSuggestion(BaseModel):
    antibiotic: str
    recommendation: str   # First-line | Alternative | Last-resort
    confidence: float
    rationale: str


class PredictionOutput(BaseModel):
    prediction_id: str
    bacterial_species: str
    antibiotic: str
    prediction: str  # Resistant | Susceptible | Intermediate
    confidence: float
    probability_resistant: float
    probability_susceptible: float
    probability_intermediate: float
    feature_importance: List[FeatureImportance]
    treatment_suggestions: List[TreatmentSuggestion]
    model_version: str
    created_at: datetime


class BatchPredictionOutput(BaseModel):
    batch_id: str
    total: int
    results: List[PredictionOutput]
    summary: Dict[str, Any]


# ─── Analysis ──────────────────────────────────────────────────────────────────

class ResistanceStats(BaseModel):
    antibiotic: str
    total_tested: int
    resistant_count: int
    susceptible_count: int
    intermediate_count: int
    resistance_rate: float


class GeneNetworkNode(BaseModel):
    id: str
    gene_name: str
    mechanism: str
    drug_class: str
    prevalence_score: float


class GeneNetworkEdge(BaseModel):
    source: str
    target: str
    weight: float
    relationship: str


class GeneNetworkData(BaseModel):
    nodes: List[GeneNetworkNode]
    edges: List[GeneNetworkEdge]


# ─── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    rows_processed: int
    columns_detected: List[str]
    preview: List[Dict[str, Any]]
    message: str
