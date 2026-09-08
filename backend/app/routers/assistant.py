from fastapi import APIRouter, Depends

from app.schemas.assistant import (
    ChatRequest,
    ChatResponse,
    FlashcardResponse,
    QuizRequest,
    QuizResponse,
    StudyPlanRequest,
    StudyPlanResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services import assistant_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: dict = Depends(get_current_user)):
    return await assistant_service.chat(current_user["email"], payload.document_id, payload.question)


@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(payload: QuizRequest, current_user: dict = Depends(get_current_user)):
    return await assistant_service.generate_quiz(
        current_user["email"], payload.document_id, payload.num_questions
    )


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(payload: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    return await assistant_service.summarize(current_user["email"], payload.document_id)


@router.post("/flashcards", response_model=FlashcardResponse)
async def generate_flashcards(payload: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    return await assistant_service.generate_flashcards(current_user["email"], payload.document_id)


@router.post("/study-plan", response_model=StudyPlanResponse)
async def study_plan(payload: StudyPlanRequest, current_user: dict = Depends(get_current_user)):
    return await assistant_service.study_plan(payload.subjects, payload.days, payload.hours_per_day)
