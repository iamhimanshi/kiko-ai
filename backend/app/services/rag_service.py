"""
Lightweight in-request RAG: encode chunks, FAISS search, return top-k.
No persistent index — fast enough for a single document.
"""
from typing import List, Optional
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

_model: Optional[SentenceTransformer] = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def retrieve(
    chunks: List[dict],
    query: str,
    top_k: int = 4,
    pages_filter: Optional[List[int]] = None,
) -> List[dict]:
    """
    chunks: [{"text": "...", "page": 1, "index": 0}]
    pages_filter: if set, only chunks on these pages are candidates.
    Returns top-k chunks (dicts) sorted by similarity desc.
    """
    if not chunks:
        return []

    candidates = chunks
    if pages_filter:
        s = set(pages_filter)
        candidates = [c for c in chunks if c.get("page") in s]

    if not candidates:
        return []

    model = get_model()
    texts = [c["text"] for c in candidates]

    emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True).astype("float32")
    q = model.encode([query], convert_to_numpy=True, normalize_embeddings=True).astype("float32")

    dim = emb.shape[1]
    index = faiss.IndexFlatIP(dim)  # inner product = cosine on normalized vectors
    index.add(emb)

    k = min(top_k, len(candidates))
    scores, idxs = index.search(q, k)

    results = []
    for score, i in zip(scores[0], idxs[0]):
        if i < 0:
            continue
        c = candidates[int(i)]
        results.append({
            "text": c["text"],
            "page": c.get("page"),
            "score": float(score),
        })
    return results