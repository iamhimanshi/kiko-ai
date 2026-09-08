from typing import Optional

from fastapi import APIRouter, Depends

from app.schemas.session import (
    ActivityBatchRequest,
    ActivityBatchResponse,
    CreateSessionRequest,
    DashboardSummary,
    EndSessionRequest,
    LiveSessionStatus,
    SessionOut,
    SessionReportOut,
)
from app.services import session_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
dashboard_router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.post("", response_model=SessionOut)
async def create_session(payload: CreateSessionRequest, current_user: dict = Depends(get_current_user)):
    return await session_service.create_session(current_user["email"], payload)


@router.get("", response_model=list[SessionReportOut])
async def list_sessions(current_user: dict = Depends(get_current_user)):
    return await session_service.list_sessions(current_user["email"])


@router.get("/active", response_model=Optional[SessionOut])
async def get_active_session(current_user: dict = Depends(get_current_user)):
    """Must stay ABOVE /{session_id} — otherwise FastAPI matches 'active'
    as a session_id path param and this route is never reached."""
    return await session_service.get_active_session(current_user["email"])


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    return await session_service.get_session(current_user["email"], session_id)


@router.post("/{session_id}/activity", response_model=ActivityBatchResponse)
async def post_activity(
    session_id: str, payload: ActivityBatchRequest, current_user: dict = Depends(get_current_user)
):
    return await session_service.ingest_activity(current_user["email"], session_id, payload)


@router.post("/{session_id}/end", response_model=SessionReportOut)
async def end_session(
    session_id: str, payload: EndSessionRequest, current_user: dict = Depends(get_current_user)
):
    return await session_service.end_session(current_user["email"], session_id, payload.goal_completed)


@router.get("/{session_id}/report", response_model=SessionReportOut)
async def get_report(session_id: str, current_user: dict = Depends(get_current_user)):
    return await session_service.get_report(current_user["email"], session_id)


@router.get("/{session_id}/live", response_model=LiveSessionStatus)
async def get_live_status(session_id: str, current_user: dict = Depends(get_current_user)):
    return await session_service.get_live_status(current_user["email"], session_id)


@dashboard_router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    return await session_service.dashboard_summary(current_user["email"])
