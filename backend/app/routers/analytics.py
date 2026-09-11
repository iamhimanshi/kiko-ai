from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def overview(
    range: str = Query("7d", pattern="^(today|7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await analytics_service.compute_overview(db, current_user.id, range)


@router.get("/focus-trends")
async def focus_trends(
    range: str = Query("7d", pattern="^(7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await analytics_service.compute_focus_trends(db, current_user.id, range)


@router.get("/top-distracting")
async def top_distracting(
    range: str = Query("7d", pattern="^(today|7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await analytics_service.compute_top_distracting(db, current_user.id, range)


@router.get("/session/{session_id}/report")
async def session_report(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = await analytics_service.compute_session_report(db, current_user.id, session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Session not found")
    return report