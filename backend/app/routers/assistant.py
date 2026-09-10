from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.assistant import (
    SummaryRequest, SummaryResponse,
    ChatRequest, ChatResponse,
    FlashcardGenerateRequest, FlashcardResponse,
    QuizGenerateRequest, QuizResponse,
)
from app.services import assistant_service
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select
from app.models.practice_record import PracticeRecord
from app.schemas.assistant import PracticeRecordResponse

router = APIRouter(prefix="/assistant", tags=["AI Study Assistant"])


@router.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    data: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = await assistant_service.generate_summary(
        db, current_user.id, data.document_id, data.style, data.pages
    )
    return SummaryResponse(
        document_id=data.document_id,
        style=data.style,
        summary=summary,
        pages=data.pages,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await assistant_service.chat(
        db,
        current_user.id,
        data.message,
        data.document_id,
        data.pages,
        [m.model_dump() for m in data.history],
    )
    return ChatResponse(reply=result["reply"], sources=result["sources"])


@router.post("/flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    data: FlashcardGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cards = await assistant_service.generate_flashcards(
        db, current_user.id, data.document_id, data.pages, data.count, data.difficulty
    )
    return FlashcardResponse(document_id=data.document_id, cards=cards)


@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    data: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    questions = await assistant_service.generate_quiz(
        db, current_user.id, data.document_id, data.pages, data.count, data.difficulty
    )
    return QuizResponse(document_id=data.document_id, questions=questions)

@router.get("/practice/history", response_model=List[PracticeRecordResponse])
async def practice_history(
    type: Optional[str] = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(PracticeRecord).where(PracticeRecord.user_id == current_user.id)
    if type in ("flashcards", "quiz"):
        query = query.where(PracticeRecord.type == type)
    query = query.order_by(PracticeRecord.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/practice/history/{record_id}", response_model=PracticeRecordResponse)
async def practice_history_detail(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PracticeRecord).where(
            PracticeRecord.id == record_id,
            PracticeRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.delete("/practice/history/{record_id}", status_code=204)
async def delete_practice_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PracticeRecord).where(
            PracticeRecord.id == record_id,
            PracticeRecord.user_id == current_user.id,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    await db.delete(record)
    await db.commit()
    return None