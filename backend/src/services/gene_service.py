# File: backend/src/services/gene_service.py
"""Resistance gene network analysis using NetworkX."""
from typing import Any, Dict, List, Tuple

import networkx as nx
import structlog

logger = structlog.get_logger()

# Curated resistance gene database (subset of CARD)
GENE_DATABASE = [
    {"id": "g1", "gene_name": "blaTEM-1", "mechanism": "Beta-lactamase", "drug_class": "Penicillins", "prevalence_score": 0.92},
    {"id": "g2", "gene_name": "blaSHV-1", "mechanism": "Beta-lactamase", "drug_class": "Penicillins/Cephalosporins", "prevalence_score": 0.75},
    {"id": "g3", "gene_name": "blaOXA-48", "mechanism": "Carbapenemase", "drug_class": "Carbapenems", "prevalence_score": 0.61},
    {"id": "g4", "gene_name": "blaCTX-M-15", "mechanism": "ESBL", "drug_class": "Cephalosporins", "prevalence_score": 0.88},
    {"id": "g5", "gene_name": "mecA", "mechanism": "PBP2a alteration", "drug_class": "Beta-lactams", "prevalence_score": 0.79},
    {"id": "g6", "gene_name": "vanA", "mechanism": "D-Ala-D-Lac ligase", "drug_class": "Glycopeptides", "prevalence_score": 0.55},
    {"id": "g7", "gene_name": "vanB", "mechanism": "D-Ala-D-Lac ligase", "drug_class": "Glycopeptides", "prevalence_score": 0.48},
    {"id": "g8", "gene_name": "aac(6')-Ib", "mechanism": "Aminoglycoside acetyltransferase", "drug_class": "Aminoglycosides", "prevalence_score": 0.67},
    {"id": "g9", "gene_name": "aph(3')-Ia", "mechanism": "Aminoglycoside phosphotransferase", "drug_class": "Aminoglycosides", "prevalence_score": 0.58},
    {"id": "g10", "gene_name": "ermB", "mechanism": "rRNA methylation", "drug_class": "Macrolides/Lincosamides", "prevalence_score": 0.71},
    {"id": "g11", "gene_name": "ermA", "mechanism": "rRNA methylation", "drug_class": "Macrolides", "prevalence_score": 0.63},
    {"id": "g12", "gene_name": "tetM", "mechanism": "Ribosomal protection", "drug_class": "Tetracyclines", "prevalence_score": 0.69},
    {"id": "g13", "gene_name": "tetA", "mechanism": "Efflux pump", "drug_class": "Tetracyclines", "prevalence_score": 0.74},
    {"id": "g14", "gene_name": "sul1", "mechanism": "DHPS alteration", "drug_class": "Sulfonamides", "prevalence_score": 0.77},
    {"id": "g15", "gene_name": "sul2", "mechanism": "DHPS alteration", "drug_class": "Sulfonamides", "prevalence_score": 0.65},
    {"id": "g16", "gene_name": "qnrS", "mechanism": "DNA gyrase protection", "drug_class": "Fluoroquinolones", "prevalence_score": 0.52},
    {"id": "g17", "gene_name": "qnrB", "mechanism": "DNA gyrase protection", "drug_class": "Fluoroquinolones", "prevalence_score": 0.49},
    {"id": "g18", "gene_name": "dfrA1", "mechanism": "DHFR alteration", "drug_class": "Trimethoprim", "prevalence_score": 0.60},
    {"id": "g19", "gene_name": "cfr", "mechanism": "rRNA methylation", "drug_class": "Phenicols/Lincosamides", "prevalence_score": 0.41},
    {"id": "g20", "gene_name": "mcr-1", "mechanism": "Lipid A modification", "drug_class": "Colistin", "prevalence_score": 0.38},
]

# Co-occurrence edges (genes found together in MDR strains)
GENE_EDGES = [
    ("g1", "g2", 0.85, "co-occurrence"),
    ("g1", "g4", 0.78, "co-occurrence"),
    ("g2", "g4", 0.82, "co-occurrence"),
    ("g3", "g4", 0.69, "co-occurrence"),
    ("g5", "g10", 0.61, "co-occurrence"),
    ("g6", "g7", 0.72, "co-occurrence"),
    ("g8", "g9", 0.80, "co-occurrence"),
    ("g8", "g14", 0.65, "co-occurrence"),
    ("g10", "g11", 0.75, "co-occurrence"),
    ("g12", "g13", 0.70, "co-occurrence"),
    ("g14", "g15", 0.88, "co-occurrence"),
    ("g16", "g17", 0.77, "co-occurrence"),
    ("g1", "g14", 0.55, "co-occurrence"),
    ("g4", "g16", 0.60, "co-occurrence"),
    ("g5", "g8", 0.50, "co-occurrence"),
    ("g3", "g20", 0.45, "co-occurrence"),
    ("g1", "g8", 0.58, "co-occurrence"),
    ("g14", "g18", 0.72, "co-occurrence"),
    ("g10", "g19", 0.43, "co-occurrence"),
]


def build_gene_network() -> nx.Graph:
    """Build NetworkX graph of resistance gene co-occurrences."""
    G = nx.Graph()
    for gene in GENE_DATABASE:
        G.add_node(gene["id"], **gene)
    for src, tgt, weight, rel in GENE_EDGES:
        G.add_edge(src, tgt, weight=weight, relationship=rel)
    return G


def get_gene_network_data() -> Dict[str, Any]:
    """Return nodes and edges for frontend visualization."""
    G = build_gene_network()
    nodes = []
    for node_id, data in G.nodes(data=True):
        degree = G.degree(node_id)
        nodes.append({**data, "degree": degree})

    edges = []
    for src, tgt, data in G.edges(data=True):
        edges.append({
            "source": src,
            "target": tgt,
            "weight": data.get("weight", 0.5),
            "relationship": data.get("relationship", "unknown"),
        })

    # Compute centrality metrics
    betweenness = nx.betweenness_centrality(G, weight="weight")
    for node in nodes:
        node["betweenness_centrality"] = round(betweenness.get(node["id"], 0), 4)

    return {"nodes": nodes, "edges": edges, "stats": {
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "avg_clustering": round(nx.average_clustering(G), 4),
        "density": round(nx.density(G), 4),
    }}


def get_gene_community_detection() -> List[Dict[str, Any]]:
    """Detect gene communities using Louvain-like greedy modularity."""
    G = build_gene_network()
    communities = nx.community.greedy_modularity_communities(G)
    result = []
    gene_map = {g["id"]: g for g in GENE_DATABASE}
    for i, community in enumerate(communities):
        members = [gene_map[node_id] for node_id in community if node_id in gene_map]
        result.append({
            "community_id": i + 1,
            "size": len(members),
            "members": members,
            "dominant_drug_class": _most_common([m["drug_class"] for m in members]),
        })
    return result


def _most_common(lst: List[str]) -> str:
    if not lst:
        return "Unknown"
    return max(set(lst), key=lst.count)


def get_resistance_statistics() -> List[Dict[str, Any]]:
    """Return mock resistance statistics by antibiotic (from dataset analysis)."""
    return [
        {"antibiotic": "Amoxicillin", "resistance_rate": 0.64, "total_tested": 1247, "resistant": 798, "susceptible": 324, "intermediate": 125},
        {"antibiotic": "Ciprofloxacin", "resistance_rate": 0.38, "total_tested": 1189, "resistant": 452, "susceptible": 623, "intermediate": 114},
        {"antibiotic": "Vancomycin", "resistance_rate": 0.12, "total_tested": 934, "resistant": 112, "susceptible": 782, "intermediate": 40},
        {"antibiotic": "Ceftriaxone", "resistance_rate": 0.44, "total_tested": 1102, "resistant": 485, "susceptible": 517, "intermediate": 100},
        {"antibiotic": "Meropenem", "resistance_rate": 0.18, "total_tested": 867, "resistant": 156, "susceptible": 672, "intermediate": 39},
        {"antibiotic": "Gentamicin", "resistance_rate": 0.29, "total_tested": 978, "resistant": 284, "susceptible": 623, "intermediate": 71},
        {"antibiotic": "Tetracycline", "resistance_rate": 0.57, "total_tested": 1056, "resistant": 602, "susceptible": 354, "intermediate": 100},
        {"antibiotic": "Erythromycin", "resistance_rate": 0.52, "total_tested": 889, "resistant": 462, "susceptible": 358, "intermediate": 69},
        {"antibiotic": "Trimethoprim", "resistance_rate": 0.48, "total_tested": 1034, "resistant": 496, "susceptible": 456, "intermediate": 82},
        {"antibiotic": "Penicillin", "resistance_rate": 0.71, "total_tested": 1123, "resistant": 797, "susceptible": 256, "intermediate": 70},
    ]
