# File: backend/src/routes/analysis.py
"""Analysis and statistics endpoints."""
from fastapi import APIRouter

from src.services.gene_service import get_resistance_statistics, get_gene_community_detection

router = APIRouter()


@router.get("/resistance-stats")
async def resistance_statistics():
    """Resistance rates per antibiotic from the dataset."""
    return {"data": get_resistance_statistics()}


@router.get("/gene-communities")
async def gene_communities():
    """Resistance gene communities detected via network analysis."""
    return {"communities": get_gene_community_detection()}
