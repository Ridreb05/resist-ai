# File: backend/src/routes/prediction.py
"""Resistance prediction endpoints."""
import uuid
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.middleware.auth import get_optional_user
from src.models.models import PredictionResult, User
from src.models.schemas import (
    BatchPredictionInput,
    BatchPredictionOutput,
    PredictionInput,
    PredictionOutput,
    UploadResponse,
)
from src.services.ml_service import get_predictor, ANTIBIOTICS

logger = structlog.get_logger()
router = APIRouter()


@router.post("/single", response_model=PredictionOutput)
async def predict_single(
    data: PredictionInput,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Predict antibiotic resistance for a single bacterial isolate.

    Provide features such as MIC values, zone diameters, and/or gene presence markers.
    """
    predictor = get_predictor()
    try:
        result = predictor.predict(data.features, data.antibiotic)
    except Exception as e:
        logger.error("prediction.failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    prediction_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    # Persist to DB
    record = PredictionResult(
        id=prediction_id,
        user_id=current_user.id if current_user else None,
        session_id=session_id,
        bacterial_species=data.bacterial_species,
        input_features=data.features,
        antibiotic=data.antibiotic,
        prediction=result["prediction"],
        confidence=result["confidence"],
        feature_importance=result["feature_importance"],
        treatment_suggestions=result["treatment_suggestions"],
    )
    db.add(record)

    logger.info(
        "prediction.completed",
        prediction_id=prediction_id,
        species=data.bacterial_species,
        antibiotic=data.antibiotic,
        result=result["prediction"],
        confidence=round(result["confidence"], 3),
    )

    return PredictionOutput(
        prediction_id=prediction_id,
        bacterial_species=data.bacterial_species,
        antibiotic=data.antibiotic,
        prediction=result["prediction"],
        confidence=result["confidence"],
        probability_resistant=result["probability_resistant"],
        probability_susceptible=result["probability_susceptible"],
        probability_intermediate=result["probability_intermediate"],
        feature_importance=result["feature_importance"],
        treatment_suggestions=result["treatment_suggestions"],
        model_version=predictor.get_model_metrics()["model_type"],
        created_at=datetime.now(timezone.utc),
    )


@router.post("/batch", response_model=BatchPredictionOutput)
async def predict_batch(
    data: BatchPredictionInput,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Predict resistance for up to 100 isolates in a single request."""
    predictor = get_predictor()
    batch_id = str(uuid.uuid4())
    results = []

    resistant_count = 0
    susceptible_count = 0
    intermediate_count = 0

    for isolate in data.isolates:
        try:
            result = predictor.predict(isolate.features, isolate.antibiotic)
            pred_id = str(uuid.uuid4())
            if result["prediction"] == "Resistant":
                resistant_count += 1
            elif result["prediction"] == "Susceptible":
                susceptible_count += 1
            else:
                intermediate_count += 1

            results.append(
                PredictionOutput(
                    prediction_id=pred_id,
                    bacterial_species=isolate.bacterial_species,
                    antibiotic=isolate.antibiotic,
                    prediction=result["prediction"],
                    confidence=result["confidence"],
                    probability_resistant=result["probability_resistant"],
                    probability_susceptible=result["probability_susceptible"],
                    probability_intermediate=result["probability_intermediate"],
                    feature_importance=result["feature_importance"],
                    treatment_suggestions=result["treatment_suggestions"],
                    model_version="ensemble-v1",
                    created_at=datetime.now(timezone.utc),
                )
            )
        except Exception as e:
            logger.error("batch_prediction.item_failed", error=str(e), isolate=isolate.bacterial_species)

    total = len(results)
    return BatchPredictionOutput(
        batch_id=batch_id,
        total=total,
        results=results,
        summary={
            "resistant": resistant_count,
            "susceptible": susceptible_count,
            "intermediate": intermediate_count,
            "resistance_rate": round(resistant_count / total, 3) if total > 0 else 0,
        },
    )


@router.get("/antibiotics")
async def list_antibiotics():
    """Return list of supported antibiotics."""
    return {"antibiotics": ANTIBIOTICS}


@router.get("/model-info")
async def model_info():
    """Return model metadata and performance metrics."""
    predictor = get_predictor()
    return predictor.get_model_metrics()
