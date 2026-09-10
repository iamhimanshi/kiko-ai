from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.assistant import (
    SummaryRequest, SummaryResponse,
    ChatRequest, ChatResponse,
)
from app.services import assistant_service

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