import os
import shutil
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile, HTTPException

from app.models.document import Document
from app.models.user import User
from app.core.config import settings


async def save_document(
    db: AsyncSession,
    user_id: int,
    file: UploadFile,
    extracted_text: str,
    chunks: List[str],
    page_count: int,
    word_count: int
) -> Document:
    """Save document metadata to database."""
    
    # Create uploads directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file to disk
    file_path = os.path.join(settings.UPLOAD_DIR, f"{user_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save metadata to database
    document = Document(
        user_id=user_id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(extracted_text),
        chunks=chunks,
        page_count=page_count,
        word_count=word_count
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def get_user_documents(db: AsyncSession, user_id: int) -> List[Document]:
    """Get all documents for a user."""
    result = await db.execute(
        select(Document).where(Document.user_id == user_id)
    )
    return result.scalars().all()


async def get_document(db: AsyncSession, document_id: int, user_id: int) -> Optional[Document]:
    """Get a specific document if it belongs to the user."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def delete_document(db: AsyncSession, document_id: int, user_id: int) -> bool:
    """Delete a document if it belongs to the user."""
    document = await get_document(db, document_id, user_id)
    if not document:
        return False
    
    # Delete file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Delete from database
    await db.delete(document)
    await db.commit()
    return True
