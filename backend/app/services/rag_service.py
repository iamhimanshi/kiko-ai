"""
RAG pipeline: PyMuPDF extraction -> chunking -> SentenceTransformer
embeddings -> FAISS similarity search.

This is the one part of the old prototype that was already solid, so
the algorithm is preserved as-is. What changed:
  - FAISS indices are cached in-memory per document_id (as before) but
    are now rebuilt on-demand from chunks persisted in MongoDB, so a
    server restart no longer loses the ability to chat with a PDF —
    only the (cheap to rebuild) index itself is ephemeral.
"""
from typing import List

import fitz  # PyMuPDF
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

_embedding_model: SentenceTransformer | None = None
_faiss_index_cache: dict[str, "faiss.Index"] = {}


def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        raise Exception(f"Failed to extract text: {str(e)}")
    return text


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
    words = text.split()
    if len(words) == 0:
        return []

    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def create_embeddings(chunks: List[str]) -> np.ndarray:
    if not chunks:
        return np.array([])
    return get_embedding_model().encode(chunks)


def build_faiss_index(document_id: str, chunks: List[str]) -> "faiss.Index":
    embeddings = create_embeddings(chunks)
    if embeddings.shape[0] == 0:
        raise Exception("No embeddings to index")

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype("float32"))
    _faiss_index_cache[document_id] = index
    return index


def get_or_build_index(document_id: str, chunks: List[str]) -> "faiss.Index":
    """Return the cached index, rebuilding from `chunks` if it's missing
    (e.g. after a server restart) instead of failing outright."""
    if document_id in _faiss_index_cache:
        return _faiss_index_cache[document_id]
    return build_faiss_index(document_id, chunks)


def drop_index(document_id: str) -> None:
    _faiss_index_cache.pop(document_id, None)


def search(index: "faiss.Index", question: str, top_k: int = 3) -> List[int]:
    query_embedding = get_embedding_model().encode([question])
    query_embedding = query_embedding.reshape(1, -1).astype("float32")
    distances, indices = index.search(query_embedding, top_k)
    return [int(i) for i in indices[0]]
