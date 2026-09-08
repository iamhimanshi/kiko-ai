from typing import List

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    upload_date: str
    chunks: int
    pages: int


class DocumentListResponse(BaseModel):
    documents: List[DocumentOut]


class UploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    chunks: int
    pages: int


class DeleteResponse(BaseModel):
    message: str
