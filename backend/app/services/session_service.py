from datetime import datetime, timezone
from typing import Optional, List
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from app.models.session import StudySession, SessionStatus
from app.schemas.session import SessionCreate


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_task_objects(task_texts: List[str]) -> List[dict]:
    return [
        {
            "id": str(uuid4()),
            "text": text,
            "is_completed": False,
            "order": idx,
        }
        for idx, text in enumerate(task_texts)
    ]


async def get_active_session(
    db: AsyncSession, user_id: int
) -> Optional[StudySession]:
    """Return the user's single ACTIVE or PAUSED session, if any."""
    result = await db.execute(
        select(StudySession).where(
            and_(
                StudySession.user_id == user_id,
                StudySession.status.in_(
                    [SessionStatus.ACTIVE.value, SessionStatus.PAUSED.value]
                ),
            )
        )
    )
    return result.scalar_one_or_none()


async def create_session(
    db: AsyncSession, user_id: int, data: SessionCreate
) -> StudySession:
    # Enforce one active session per user
    existing = await get_active_session(db, user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active study session. End it first.",
        )

    tasks = _to_task_objects(data.tasks)
    now = _now()

    session = StudySession(
    user_id=user_id,
    subject=data.subject,
    goal=data.goal,
    duration_minutes=data.duration_minutes,
    mode=data.mode,
    work_duration_minutes=data.work_duration_minutes if data.mode == "pomodoro" else None,
    break_duration_minutes=data.break_duration_minutes if data.mode == "pomodoro" else None,
    tasks=tasks,
    status=SessionStatus.ACTIVE.value,
    started_at=now,
    paused_duration_seconds=0,
    completed_tasks=0,
    total_tasks=len(tasks),
)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(
    db: AsyncSession, session_id: int, user_id: int
) -> StudySession:
    result = await db.execute(
        select(StudySession).where(
            and_(StudySession.id == session_id, StudySession.user_id == user_id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def pause_session(
    db: AsyncSession, session_id: int, user_id: int
) -> StudySession:
    session = await get_session(db, session_id, user_id)
    if session.status != SessionStatus.ACTIVE.value:
        raise HTTPException(
            status_code=400, detail="Only an ACTIVE session can be paused"
        )

    session.status = SessionStatus.PAUSED.value
    session.paused_at = _now()
    await db.commit()
    await db.refresh(session)
    return session


async def resume_session(
    db: AsyncSession, session_id: int, user_id: int
) -> StudySession:
    session = await get_session(db, session_id, user_id)
    if session.status != SessionStatus.PAUSED.value:
        raise HTTPException(
            status_code=400, detail="Only a PAUSED session can be resumed"
        )

    if session.paused_at:
        paused_seconds = int((_now() - session.paused_at).total_seconds())
        session.paused_duration_seconds += max(paused_seconds, 0)
        session.paused_at = None

    session.status = SessionStatus.ACTIVE.value
    await db.commit()
    await db.refresh(session)
    return session


async def end_session(
    db: AsyncSession, session_id: int, user_id: int
) -> StudySession:
    session = await get_session(db, session_id, user_id)
    if session.status == SessionStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Session already ended")
    if session.status == SessionStatus.ABANDONED.value:
        raise HTTPException(status_code=400, detail="Session already abandoned")

    now = _now()

    # If currently paused, add the final paused chunk
    if session.status == SessionStatus.PAUSED.value and session.paused_at:
        paused_seconds = int((now - session.paused_at).total_seconds())
        session.paused_duration_seconds += max(paused_seconds, 0)
        session.paused_at = None

    # Compute actual duration
    if session.started_at:
        total_real = int((now - session.started_at).total_seconds())
        session.actual_duration_seconds = max(
            total_real - session.paused_duration_seconds, 0
        )

    session.ended_at = now
    session.status = SessionStatus.COMPLETED.value

    await db.commit()
    await db.refresh(session)
    return session

async def toggle_task(
    db: AsyncSession, session_id: int, user_id: int, task_id: str
) -> StudySession:
    session = await get_session(db, session_id, user_id)
    if session.status not in (
        SessionStatus.ACTIVE.value,
        SessionStatus.PAUSED.value,
    ):
        raise HTTPException(
            status_code=400, detail="Cannot modify tasks for a closed session"
        )

    # Deep copy so SQLAlchemy detects the change (JSON column mutation issue)
    import copy
    tasks = copy.deepcopy(list(session.tasks or []))
    found = False
    for task in tasks:
        if task.get("id") == task_id:
            task["is_completed"] = not task.get("is_completed", False)
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Task not found")

    session.tasks = tasks
    session.completed_tasks = sum(1 for t in tasks if t.get("is_completed"))
    # Force SQLAlchemy to persist JSON change
    flag_modified(session, "tasks")
    await db.commit()
    await db.refresh(session)
    return session


async def list_user_sessions(
    db: AsyncSession, user_id: int, limit: int = 20
) -> List[StudySession]:
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user_id)
        .order_by(StudySession.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
