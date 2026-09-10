import os
import re
import time
from typing import List, Tuple
import fitz  # PyMuPDF
from fastapi import UploadFile, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import Document


ALLOWED_EXTENSIONS = {".pdf"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def _ensure_upload_dir() -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings.UPLOAD_DIR


def _extract_pages(file_path: str) -> List[dict]:
    """Return [{"number": 1, "text": "..."}, ...]"""
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    pages: List[dict] = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        if text:
            pages.append({"number": i, "text": text})
    doc.close()
    return pages


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    if not text:
        return []
    chunks: List[str] = []
    start, length = 0, len(text)
    while start < length:
        end = min(start + chunk_size, length)
        c = text[start:end].strip()
        if c:
            chunks.append(c)
        if end >= length:
            break
        start = end - overlap
    return chunks


def _build_chunks(pages: List[dict]) -> List[dict]:
    """Flatten pages into chunk dicts with page metadata."""
    result: List[dict] = []
    idx = 0
    for p in pages:
        for c in _chunk_text(p["text"]):
            result.append({"text": c, "page": p["number"], "index": idx})
            idx += 1
    return result


def _word_count(pages: List[dict]) -> int:
    return sum(len(p["text"].split()) for p in pages)


async def save_document(db: AsyncSession, user_id: int, file: UploadFile) -> Document:
    filename = file.filename or "document.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    size = len(content)
    if size == 0:
        raise HTTPException(status_code=400, detail="File is empty.")
    if size > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Max {settings.MAX_UPLOAD_SIZE_MB} MB.")

    upload_dir = _ensure_upload_dir()
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    file_path = os.path.join(upload_dir, f"{user_id}_{int(time.time())}_{safe_name}")

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        pages = _extract_pages(file_path)
    except HTTPException:
        os.remove(file_path)
        raise

    if not pages:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="No readable text found (scanned PDF?).")

    chunks = _build_chunks(pages)

    document = Document(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_size=size,
        pages=pages,
        chunks=chunks,
        page_count=len(pages),
        chunk_count=len(chunks),
        word_count=_word_count(pages),
        status="ready",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def get_user_documents(db: AsyncSession, user_id: int) -> List[Document]:
    result = await db.execute(
        select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())


async def get_document(db: AsyncSession, document_id: int, user_id: int) -> Document:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


async def delete_document(db: AsyncSession, document_id: int, user_id: int) -> bool:
    doc = await get_document(db, document_id, user_id)
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except OSError:
        pass
    await db.delete(doc)
    await db.commit()
    return True

