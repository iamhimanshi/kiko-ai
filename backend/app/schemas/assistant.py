from typing import List, Literal, Optional
from pydantic import BaseModel, Field


SummaryStyle = Literal["quick", "detailed", "points"]


class SummaryRequest(BaseModel):
    document_id: int
    style: SummaryStyle = "quick"
    pages: Optional[List[int]] = None  # None or empty = entire document


class SummaryResponse(BaseModel):
    document_id: int
    style: SummaryStyle
    summary: str
    pages: Optional[List[int]] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    document_id: Optional[int] = None
    pages: Optional[List[int]] = None
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    sources: List[dict] = []  # [{"page": 3, "preview": "..."}]