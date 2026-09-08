from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException

from app.models.session import StudySession, SessionStatus
from app.models.behavior import BehaviorEvent
from app.models.user import User


async def create_session(
    db: AsyncSession,
    user_id: int,
    goal: str,
    subject: str,
    duration_minutes: int,
    tasks: List[str]
) -> StudySession:
    """Create a new study session."""
    session = StudySession(
        user_id=user_id,
        goal=goal,
        subject=subject,
        duration_minutes=duration_minutes,
        tasks=tasks,
        status=SessionStatus.ACTIVE
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_active_session(db: AsyncSession, user_id: int) -> Optional[StudySession]:
    """Get the current active session for a user."""
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == user_id,
            StudySession.status == SessionStatus.ACTIVE
        )
    )
    return result.scalar_one_or_none()


async def end_session(
    db: AsyncSession,
    session_id: int,
    user_id: int
) -> StudySession:
    """End a study session and calculate metrics."""
    result = await db.execute(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session already ended")
    
    # Calculate metrics
    now = datetime.utcnow()
    session.ended_at = now
    session.status = SessionStatus.COMPLETED
    
    # Calculate actual duration in minutes
    if session.started_at:
        delta = now - session.started_at
        session.actual_duration_minutes = int(delta.total_seconds() / 60)
    
    await db.commit()
    await db.refresh(session)
    return session


async def get_user_sessions(
    db: AsyncSession,
    user_id: int,
    limit: int = 10
) -> List[StudySession]:
    """Get recent sessions for a user."""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user_id)
        .order_by(StudySession.started_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def record_behavior_event(
    db: AsyncSession,
    session_id: int,
    url: str,
    domain: str,
    page_title: str,
    time_spent_seconds: int,
    tab_switches: int = 0,
    idle_seconds: int = 0,
    scroll_events: int = 0,
    mouse_events: int = 0,
    keyboard_events: int = 0,
    is_distracting: bool = False,
    distraction_reason: str = None,
    focus_state: str = None
) -> BehaviorEvent:
    """Record a behavior event for a session."""
    event = BehaviorEvent(
        session_id=session_id,
        url=url,
        domain=domain,
        page_title=page_title,
        time_spent_seconds=time_spent_seconds,
        tab_switches=tab_switches,
        idle_seconds=idle_seconds,
        scroll_events=scroll_events,
        mouse_events=mouse_events,
        keyboard_events=keyboard_events,
        is_distracting=is_distracting,
        distraction_reason=distraction_reason,
        focus_state=focus_state
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event