from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    page_count: int
    word_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class DocumentDetail(DocumentResponse):
    chunks: List[str] = []