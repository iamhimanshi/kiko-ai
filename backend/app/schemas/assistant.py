from typing import List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    document_id: str
    question: str = Field(min_length=1)


class ChatSource(BaseModel):
    chunk: str
    index: int


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[ChatSource]


class QuizRequest(BaseModel):
    document_id: str
    num_questions: int = Field(default=5, ge=1, le=20)


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str


class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
    total: int
    error: Optional[str] = None


class SummarizeRequest(BaseModel):
    document_id: str


class SummarizeResponse(BaseModel):
    summary: str


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]


class StudyPlanRequest(BaseModel):
    subjects: str
    days: int = Field(ge=1, le=90)
    hours_per_day: float = Field(gt=0, le=24)


class StudyPlanResponse(BaseModel):
    study_plan: str
