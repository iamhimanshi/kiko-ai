"""
Shape of a `documents` document in MongoDB (an uploaded PDF + its
extracted chunks). FAISS indices are NOT persisted here — they're
rebuilt in memory from `chunks` on demand (see rag_service).
"""
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class DocumentInDB(BaseModel):
    id: str
    filename: str
    user_email: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    chunks: List[str]
    page_count: int
    word_count: int

    def to_mongo(self) -> dict:
        data = self.model_dump()
        data["_id"] = data.pop("id")
        return data
