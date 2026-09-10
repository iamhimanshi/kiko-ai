from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.session import (
    SessionCreate,
    SessionResponse,
    EndSessionResponse,
    TaskToggleResponse,
)
from app.services import session_service

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    data: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.create_session(db, current_user.id, data)


@router.get("/active", response_model=Optional[SessionResponse])
async def get_active(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.get_active_session(db, current_user.id)


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.list_user_sessions(db, current_user.id, limit)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.get_session(db, session_id, current_user.id)


@router.post("/{session_id}/pause", response_model=SessionResponse)
async def pause_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.pause_session(db, session_id, current_user.id)


@router.post("/{session_id}/resume", response_model=SessionResponse)
async def resume_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await session_service.resume_session(db, session_id, current_user.id)


@router.post("/{session_id}/end", response_model=EndSessionResponse)
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await session_service.end_session(db, session_id, current_user.id)
    return EndSessionResponse(session=session, message="Session completed")


@router.patch("/{session_id}/tasks/{task_id}", response_model=TaskToggleResponse)
async def toggle_task(
    session_id: int,
    task_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = await session_service.toggle_task(
        db, session_id, current_user.id, task_id
    )
    updated_task = next(
        (t for t in session.tasks if t.get("id") == task_id), None
    )
    return TaskToggleResponse(
        task_id=task_id,
        is_completed=updated_task.get("is_completed", False) if updated_task else False,
        completed_tasks=session.completed_tasks,
        total_tasks=session.total_tasks,
    )





