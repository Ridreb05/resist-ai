# File: backend/src/models/models.py
"""SQLAlchemy ORM models for ResistAI."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship

from src.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    predictions = relationship("PredictionResult", back_populates="user", lazy="dynamic")


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    session_id = Column(String(36), nullable=False, index=True)

    # Input data
    bacterial_species = Column(String(255), nullable=False)
    input_features = Column(JSON, nullable=False)

    # Prediction outputs
    antibiotic = Column(String(255), nullable=False)
    prediction = Column(String(50), nullable=False)  # Resistant | Susceptible | Intermediate
    confidence = Column(Float, nullable=False)
    model_version = Column(String(50), default="v1")

    # SHAP feature importance
    feature_importance = Column(JSON, nullable=True)

    # Treatment suggestion
    treatment_suggestions = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="predictions")


class BacterialIsolate(Base):
    __tablename__ = "bacterial_isolates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    isolate_id = Column(String(100), unique=True, nullable=False)
    species = Column(String(255), nullable=False, index=True)
    source = Column(String(255), nullable=True)   # clinical | environmental
    isolate_metadata = Column(JSON, nullable=True)   # renamed: 'metadata' is reserved by SQLAlchemy
    created_at = Column(DateTime(timezone=True), default=utcnow)

    resistance_profiles = relationship("ResistanceProfile", back_populates="isolate")


class ResistanceProfile(Base):
    __tablename__ = "resistance_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    isolate_id = Column(String(36), ForeignKey("bacterial_isolates.id"), nullable=False)
    antibiotic = Column(String(255), nullable=False)
    outcome = Column(String(50), nullable=False)   # Resistant | Susceptible | Intermediate
    mic_value = Column(Float, nullable=True)
    test_method = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    isolate = relationship("BacterialIsolate", back_populates="resistance_profiles")


class ResistanceGene(Base):
    __tablename__ = "resistance_genes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    gene_name = Column(String(255), unique=True, nullable=False, index=True)
    mechanism = Column(String(255), nullable=True)
    drug_class = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    prevalence_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
