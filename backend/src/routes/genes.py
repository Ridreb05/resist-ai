# File: backend/src/routes/genes.py
"""Resistance gene network endpoints."""
from fastapi import APIRouter

from src.services.gene_service import get_gene_network_data

router = APIRouter()


@router.get("/network")
async def gene_network():
    """
    Return resistance gene co-occurrence network.
    Nodes are resistance genes; edges represent co-occurrence in MDR isolates.
    """
    return get_gene_network_data()
