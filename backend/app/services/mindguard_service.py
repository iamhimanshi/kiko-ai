from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import StudySession, SessionStatus
from app.models.behavior import BehaviorEvent
from app.engines import focus_engine
from app.schemas.mindguard import ActivityItem


EXTENSION_HEARTBEAT_SECONDS = 90  # extension considered connected if event < 90s old


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_active_session(db: AsyncSession, user_id: int) -> Optional[StudySession]:
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


async def _prior_distraction_stats(
    db: AsyncSession, session_id: int
) -> tuple[int, float]:
    """Return (count, total_minutes) of prior distracting events."""
    result = await db.execute(
        select(BehaviorEvent).where(
            and_(
                BehaviorEvent.session_id == session_id,
                BehaviorEvent.is_distracting == True,  # noqa: E712
            )
        )
    )
    events = list(result.scalars().all())
    count = len(events)
    total_seconds = sum(e.time_spent_seconds or 0 for e in events)
    return count, total_seconds / 60.0


async def process_activity_batch(
    db: AsyncSession, user_id: int, activities: List[ActivityItem], session_id: Optional[int] = None
) -> dict:
    # Resolve session
    if session_id:
        result = await db.execute(
            select(StudySession).where(
                and_(StudySession.id == session_id, StudySession.user_id == user_id)
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = await get_active_session(db, user_id)
        if not session:
            raise HTTPException(status_code=400, detail="No active session")

    if session.status == SessionStatus.PAUSED.value:
        raise HTTPException(status_code=400, detail="Session is paused")

    results = []
    for item in activities:
        classification = focus_engine.classify_activity(
            session, item.url, item.page_title
        )

        prior_count, prior_minutes = await _prior_distraction_stats(db, session.id)
        intervention = focus_engine.compute_intervention(
            classification["classification"],
            prior_count,
            prior_minutes,
            item.time_spent_seconds,
        )

        event = BehaviorEvent(
            session_id=session.id,
            url=item.url,
            domain=item.domain or focus_engine.extract_domain(item.url),
            page_title=item.page_title,
            time_spent_seconds=item.time_spent_seconds,
            tab_switches=item.tab_switches,
            idle_seconds=item.idle_seconds,
            scroll_events=item.scroll_events,
            mouse_events=item.mouse_events,
            keyboard_events=item.keyboard_events,
            is_distracting=(classification["classification"] == "distracting"),
            distraction_reason=classification["reason"],
            focus_state=classification["focus_state"],
        )
        db.add(event)

        results.append({
            "url": item.url,
            "domain": event.domain,
            "page_title": item.page_title,
            "classification": classification["classification"],
            "focus_state": classification["focus_state"],
            "reason": classification["reason"],
            "time_spent_seconds": item.time_spent_seconds,
            "intervention_level": intervention["level"],
            "intervention_title": intervention["title"],
            "intervention_message": intervention["message"],
        })

    await db.commit()
    return {"session_id": session.id, "results": results}


async def get_status(db: AsyncSession, user_id: int) -> dict:
    session = await get_active_session(db, user_id)

    if not session:
        return {
            "has_active_session": False,
            "current_focus_state": "idle",
            "extension_connected": False,
            "distraction_count": 0,
            "distraction_seconds": 0,
            "focused_seconds": 0,
            "longest_focus_seconds": 0,
        }

    # Get all events for the session (chronological)
    result = await db.execute(
        select(BehaviorEvent)
        .where(BehaviorEvent.session_id == session.id)
        .order_by(BehaviorEvent.recorded_at.asc())
    )
    events = list(result.scalars().all())

    if not events:
        last_activity = None
        current = None
    else:
        last = events[-1]
        last_activity = last.recorded_at
        time_on_page = int((_now() - last.recorded_at).total_seconds()) if last.recorded_at else 0
        current = {
            "url": last.url,
            "domain": last.domain,
            "page_title": last.page_title,
            "classification": (
                "distracting" if last.is_distracting
                else "relevant" if last.focus_state == "focused"
                else "uncertain"
            ),
            "focus_state": last.focus_state,
            "reason": last.distraction_reason,
            "time_on_page_seconds": time_on_page,
            "recorded_at": last.recorded_at,
        }

    distraction_events = [e for e in events if e.is_distracting]
    focused_events = [e for e in events if e.focus_state == "focused"]

    distraction_seconds = sum(e.time_spent_seconds or 0 for e in distraction_events)
    focused_seconds = sum(e.time_spent_seconds or 0 for e in focused_events)

    # Longest continuous focused streak
    longest = 0
    current_streak = 0
    for e in events:
        if e.focus_state == "focused":
            current_streak += (e.time_spent_seconds or 0)
            longest = max(longest, current_streak)
        else:
            current_streak = 0

    # Current focus state
    if session.status == SessionStatus.PAUSED.value:
        current_focus_state = "paused"
    elif current is None:
        current_focus_state = "idle"
    elif last_activity and (_now() - last_activity) > timedelta(minutes=5):
        current_focus_state = "idle"
    else:
        current_focus_state = current["focus_state"]

    extension_connected = bool(
        last_activity and (_now() - last_activity) < timedelta(seconds=EXTENSION_HEARTBEAT_SECONDS)
    )

    # Remaining time
    remaining = None
    if session.started_at and session.status == SessionStatus.ACTIVE.value:
        elapsed_real = (_now() - session.started_at).total_seconds()
        elapsed_active = max(elapsed_real - (session.paused_duration_seconds or 0), 0)
        remaining = max(int(session.duration_minutes * 60 - elapsed_active), 0)

    return {
        "has_active_session": True,
        "session_id": session.id,
        "subject": session.subject,
        "goal": session.goal,
        "status": session.status,
        "remaining_seconds": remaining,
        "current_focus_state": current_focus_state,
        "current_activity": current,
        "extension_connected": extension_connected,
        "last_activity_at": last_activity,
        "distraction_count": len(distraction_events),
        "distraction_seconds": distraction_seconds,
        "focused_seconds": focused_seconds,
        "longest_focus_seconds": longest,
    }


async def get_live_monitor(db: AsyncSession, user_id: int) -> dict:
    session = await get_active_session(db, user_id)
    if not session:
        return {"has_active_session": False, "recent_activity": [], "recent_distractions": []}

    # Recent 20 (then dedupe by showing last 10)
    result = await db.execute(
        select(BehaviorEvent)
        .where(BehaviorEvent.session_id == session.id)
        .order_by(BehaviorEvent.recorded_at.desc())
        .limit(20)
    )
    events = list(result.scalars().all())

    if not events:
        current = None
    else:
        last = events[0]
        time_on_page = int((_now() - last.recorded_at).total_seconds()) if last.recorded_at else 0
        current = {
            "url": last.url,
            "domain": last.domain,
            "page_title": last.page_title,
            "classification": (
                "distracting" if last.is_distracting
                else "relevant" if last.focus_state == "focused"
                else "uncertain"
            ),
            "focus_state": last.focus_state,
            "reason": last.distraction_reason,
            "time_on_page_seconds": time_on_page,
            "recorded_at": last.recorded_at,
        }

    def _fmt(e):
        return {
            "url": e.url,
            "domain": e.domain,
            "page_title": e.page_title,
            "classification": (
                "distracting" if e.is_distracting
                else "relevant" if e.focus_state == "focused"
                else "uncertain"
            ),
            "focus_state": e.focus_state,
            "time_spent_seconds": e.time_spent_seconds,
            "recorded_at": e.recorded_at,
        }

    recent = [_fmt(e) for e in events[:10]]
    distractions = [_fmt(e) for e in events if e.is_distracting][:5]

    return {
        "has_active_session": True,
        "session_id": session.id,
        "subject": session.subject,
        "goal": session.goal,
        "current_activity": current,
        "recent_activity": recent,
        "recent_distractions": distractions,
    }


async def get_extension_status(db: AsyncSession, user_id: int) -> dict:
    session = await get_active_session(db, user_id)
    if not session:
        return {"connected": False, "last_seen_at": None, "active_session_id": None, "version": "1.0"}

    result = await db.execute(
        select(BehaviorEvent)
        .where(BehaviorEvent.session_id == session.id)
        .order_by(BehaviorEvent.recorded_at.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()
    last_seen = last.recorded_at if last else None
    connected = bool(
        last_seen and (_now() - last_seen) < timedelta(seconds=EXTENSION_HEARTBEAT_SECONDS)
    )

    return {
        "connected": connected,
        "last_seen_at": last_seen,
        "active_session_id": session.id,
        "version": "1.0",
    }