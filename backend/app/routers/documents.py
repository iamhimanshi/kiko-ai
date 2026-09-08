from fastapi import APIRouter, Depends, File, UploadFile

from app.schemas.document import DeleteResponse, DocumentListResponse, UploadResponse
from app.services import document_service
from app.core.database import get_db
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    return await document_service.upload_pdf(current_user["email"], file)


@router.get("", response_model=DocumentListResponse)
async def list_pdfs(current_user: dict = Depends(get_current_user)):
    docs = await document_service.list_pdfs(current_user["email"])
    return {"documents": docs}


@router.delete("/{document_id}", response_model=DeleteResponse)
async def delete_pdf(document_id: str, current_user: dict = Depends(get_current_user)):
    return await document_service.delete_pdf(current_user["email"], document_id)
