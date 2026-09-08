"""
Document (PDF) lifecycle: save file to disk, extract + chunk text,
build a FAISS index, persist metadata + chunks in MongoDB.

Old prototype kept everything (including the extracted chunks) only
in the `pdfs_db = {}` process-memory dict. Chunks and metadata now
live in MongoDB; only the FAISS index stays in memory (see
rag_service.get_or_build_index for the restart-safe rebuild path).
"""
import os
import uuid
from datetime import datetime

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.database import documents_collection
from app.services import rag_service

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


async def upload_pdf(user_email: str, file: UploadFile) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a PDF")

    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large (max {settings.MAX_UPLOAD_SIZE_MB}MB)",
        )

    document_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    try:
        text = rag_service.extract_text_from_pdf(file_path)
    except Exception as e:
        _safe_remove(file_path)
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")

    if len(text.strip()) < 100:
        _safe_remove(file_path)
        raise HTTPException(status_code=400, detail="PDF has too little text or may be scanned.")

    chunks = rag_service.chunk_text(text)
    if len(chunks) == 0:
        _safe_remove(file_path)
        raise HTTPException(status_code=400, detail="No text could be extracted")

    try:
        rag_service.build_faiss_index(document_id, chunks)
    except Exception as e:
        _safe_remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to create index: {str(e)}")

    page_count = max(1, len(text) // 500)
    doc = {
        "_id": document_id,
        "filename": file.filename,
        "user_email": user_email,
        "upload_date": datetime.utcnow().isoformat(),
        "chunks": chunks,
        "page_count": page_count,
        "word_count": len(text.split()),
    }
    await documents_collection().insert_one(doc)

    return {
        "message": "PDF uploaded and processed successfully",
        "document_id": document_id,
        "filename": file.filename,
        "chunks": len(chunks),
        "pages": page_count,
    }


async def list_pdfs(user_email: str) -> list[dict]:
    cursor = documents_collection().find({"user_email": user_email})
    result = []
    async for doc in cursor:
        result.append({
            "id": doc["_id"],
            "filename": doc["filename"],
            "upload_date": doc["upload_date"],
            "chunks": len(doc["chunks"]),
            "pages": doc["page_count"],
        })
    return result


async def get_owned_document(user_email: str, document_id: str) -> dict:
    doc = await documents_collection().find_one({"_id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="PDF not found")
    if doc["user_email"] != user_email:
        raise HTTPException(status_code=403, detail="Not authorized")
    return doc


async def delete_pdf(user_email: str, document_id: str) -> dict:
    doc = await get_owned_document(user_email, document_id)

    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")
    _safe_remove(file_path)

    await documents_collection().delete_one({"_id": document_id})
    rag_service.drop_index(document_id)

    return {"message": "PDF deleted successfully"}


def _safe_remove(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)
