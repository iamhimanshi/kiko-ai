from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime


SummaryStyle = Literal["quick", "detailed", "points"]
Difficulty = Literal["easy", "medium", "hard"]


class SummaryRequest(BaseModel):
    document_id: int
    style: SummaryStyle = "quick"
    pages: Optional[List[int]] = None


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
    sources: List[dict] = []


# -------- Flashcards --------
class FlashcardGenerateRequest(BaseModel):
    document_id: int
    pages: Optional[List[int]] = None
    count: int = Field(default=10, ge=3, le=30)
    difficulty: Difficulty = "medium"


class Flashcard(BaseModel):
    question: str
    answer: str


class FlashcardResponse(BaseModel):
    document_id: int
    cards: List[Flashcard]


# -------- Quiz --------
class QuizGenerateRequest(BaseModel):
    document_id: int
    pages: Optional[List[int]] = None
    count: int = Field(default=10, ge=3, le=30)
    difficulty: Difficulty = "medium"


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None


class QuizResponse(BaseModel):
    document_id: int
    questions: List[QuizQuestion]

class PracticeRecordResponse(BaseModel):
    id: int
    type: str
    document_id: Optional[int] = None
    document_name: Optional[str] = None
    count: int
    difficulty: Optional[str] = None
    created_at: Optional[datetime]
    data: List[dict] = []

    class Config:
        from_attributes = True


