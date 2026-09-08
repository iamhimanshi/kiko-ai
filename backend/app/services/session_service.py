"""
Session lifecycle: create -> live activity ingestion -> end -> report.

Distraction-warning logic lives here (not in the router) so it's testable
in isolation: a warning only fires after DISTRACTION_WARNING_THRESHOLD_SECONDS
of *sustained* distracted time within the current session, not on the
first distracted ping — avoids false positives from a quick accidental tab.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status

from app.core.database import (
    activity_collection,
    distraction_collection,
    reports_collection,
    sessions_collection,
)
from app.engines import analytics_engine, focus_engine, relevance_engine
from app.schemas.session import ActivityBatchRequest, CreateSessionRequest
from app.services import ai_service

DISTRACTION_WARNING_THRESHOLD_SECONDS = 10


async def create_session(user_email: str, payload: CreateSessionRequest) -> dict:
    session_id = str(uuid.uuid4())
    doc = {
        "_id": session_id,
        "user_email": user_email,
        "subject": payload.subject,
        "goal": payload.goal,
        "planned_duration_seconds": payload.planned_duration_seconds,
        "status": "active",
        "started_at": datetime.utcnow(),
        "ended_at": None,
        "goal_completed": None,
        "tasks": [{"text": t.text, "done": False} for t in payload.tasks],
    }
    await sessions_collection().insert_one(doc)
    return _to_session_out(doc)


async def get_owned_session(user_email: str, session_id: str) -> dict:
    session = await sessions_collection().find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["user_email"] != user_email:
        raise HTTPException(status_code=403, detail="Not authorized")
    return session


async def get_session(user_email: str, session_id: str) -> dict:
    session = await get_owned_session(user_email, session_id)
    return _to_session_out(session)


async def ingest_activity(user_email: str, session_id: str, payload: ActivityBatchRequest) -> dict:
    session = await get_owned_session(user_email, session_id)
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    goal = session["goal"]
    latest_classification: Optional[str] = None
    warning = False
    warning_reason: Optional[str] = None

    for event in payload.events:
        classification = relevance_engine.classify(goal, event.domain, event.page_title)
        latest_classification = classification

        await activity_collection().insert_one({
            "session_id": session_id,
            "timestamp": datetime.utcnow(),
            "domain": event.domain,
            "page_title": event.page_title,
            "duration_seconds": event.duration_seconds,
            "classification": classification,
            "tab_switch": event.tab_switch,
        })

        if classification == "distracting":
            # sum sustained distracted time on THIS domain within the session
            sustained = await _sustained_distraction_seconds(session_id, event.domain)
            if sustained >= DISTRACTION_WARNING_THRESHOLD_SECONDS:
                warning = True
                warning_reason = (
                    f"This doesn't look related to your goal: \"{goal}\". "
                    f"Current activity: {event.page_title or event.domain}"
                )
                await distraction_collection().insert_one({
                    "session_id": session_id,
                    "started_at": datetime.utcnow(),
                    "domain": event.domain,
                    "page_title": event.page_title,
                    "duration_seconds": sustained,
                    "severity": "medium" if sustained < 60 else "high",
                })

    return {
        "accepted": len(payload.events),
        "latest_classification": latest_classification,
        "distraction_warning": warning,
        "warning_reason": warning_reason,
    }


async def _sustained_distraction_seconds(session_id: str, domain: str) -> int:
    cursor = activity_collection().find({
        "session_id": session_id,
        "domain": domain,
        "classification": "distracting",
    })
    total = 0
    async for event in cursor:
        total += event.get("duration_seconds", 0)
    return total


async def end_session(user_email: str, session_id: str, goal_completed: Optional[bool]) -> dict:
    session = await get_owned_session(user_email, session_id)
    if session["status"] == "completed":
        # idempotent: return the existing report rather than erroring
        existing = await reports_collection().find_one({"session_id": session_id})
        if existing:
            return _to_report_out(existing)

    ended_at = datetime.utcnow()
    await sessions_collection().update_one(
        {"_id": session_id},
        {"$set": {"status": "completed", "ended_at": ended_at, "goal_completed": goal_completed}},
    )

    events = [e async for e in activity_collection().find({"session_id": session_id})]
    summary = focus_engine.summarize_activity(events)

    duration_seconds = int((ended_at - session["started_at"]).total_seconds())
    focus_score = analytics_engine.compute_focus_score(summary["focused_seconds"], summary["distracted_seconds"])
    classification = analytics_engine.classify_score(focus_score)

    # AI insight — failure here must NOT block the report (NFR: reliability)
    ai_insight = None
    try:
        ai_insight = _generate_insight(
            subject=session["subject"],
            goal=session["goal"],
            duration_seconds=duration_seconds,
            focused_seconds=summary["focused_seconds"],
            distracted_seconds=summary["distracted_seconds"],
            tab_switches=summary["tab_switches"],
            websites=summary["websites"],
            focus_score=focus_score,
            goal_completed=goal_completed,
        )
    except Exception:
        ai_insight = None

    report_doc = {
        "session_id": session_id,
        "user_email": user_email,
        "subject": session["subject"],
        "goal": session["goal"],
        "planned_duration_seconds": session["planned_duration_seconds"],
        "duration_seconds": duration_seconds,
        "focused_seconds": summary["focused_seconds"],
        "distracted_seconds": summary["distracted_seconds"],
        "tab_switches": summary["tab_switches"],
        "websites": summary["websites"],
        "focus_score": focus_score,
        "classification": classification,
        "goal_completed": goal_completed,
        "ai_insight": ai_insight,
        "created_at": ended_at,
    }
    await reports_collection().insert_one(report_doc)
    return _to_report_out(report_doc)


def _generate_insight(**kwargs) -> str:
    websites_summary = ", ".join(
        f"{w['domain']} ({w['seconds']}s, {w['classification']})" for w in kwargs["websites"][:5]
    ) or "no significant site activity"

    prompt = f"""
You are KIKO, a calm and encouraging study coach. Interpret this completed study session in 2-3 short sentences,
then give one concrete recommendation in a final sentence starting with "Recommendation:".
Do not repeat raw numbers back verbatim; interpret them.

Subject: {kwargs['subject']}
Goal: {kwargs['goal']}
Duration: {kwargs['duration_seconds']} seconds
Focused time: {kwargs['focused_seconds']} seconds
Distracted time: {kwargs['distracted_seconds']} seconds
Focus score: {kwargs['focus_score']}%
Tab switches: {kwargs['tab_switches']}
Top sites: {websites_summary}
Goal marked complete: {kwargs['goal_completed']}
"""
    return ai_service.generate(prompt)


async def get_report(user_email: str, session_id: str) -> dict:
    await get_owned_session(user_email, session_id)  # ownership check
    report = await reports_collection().find_one({"session_id": session_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not ready yet")
    return _to_report_out(report)


LIVE_WARNING_RECENCY_SECONDS = 20


async def get_live_status(user_email: str, session_id: str) -> dict:
    """
    Powers the Active Session screen's live focus indicator (design brief
    §21-22) — driven entirely by real extension-posted activity, not a
    fake client-side simulation. Status is "monitoring" if no activity
    has arrived yet or the most recent event is stale.
    """
    session = await get_owned_session(user_email, session_id)

    events = [e async for e in activity_collection().find({"session_id": session_id}).sort("timestamp", 1)]
    summary = focus_engine.summarize_activity(events)
    focus_score = analytics_engine.compute_focus_score(summary["focused_seconds"], summary["distracted_seconds"])

    latest_event = events[-1] if events else None
    now = datetime.utcnow()
    current_status = "monitoring"
    if latest_event and (now - latest_event["timestamp"]).total_seconds() <= LIVE_WARNING_RECENCY_SECONDS:
        current_status = "focused" if latest_event["classification"] == "relevant" else (
            "distracted" if latest_event["classification"] == "distracting" else "monitoring"
        )

    recent_distraction = await distraction_collection().find_one(
        {"session_id": session_id}, sort=[("started_at", -1)]
    )
    active_warning = None
    if recent_distraction and (now - recent_distraction["started_at"]).total_seconds() <= LIVE_WARNING_RECENCY_SECONDS:
        active_warning = {
            "domain": recent_distraction["domain"],
            "page_title": recent_distraction["page_title"],
            "goal": session["goal"],
        }

    elapsed_seconds = int((now - session["started_at"]).total_seconds())

    return {
        "status": current_status,
        "elapsed_seconds": elapsed_seconds,
        "focused_seconds": summary["focused_seconds"],
        "distracted_seconds": summary["distracted_seconds"],
        "focus_score": focus_score,
        "active_warning": active_warning,
    }


async def list_sessions(user_email: str, limit: int = 20) -> list[dict]:
    cursor = reports_collection().find({"user_email": user_email}).sort("created_at", -1).limit(limit)
    return [_to_report_out(r) async for r in cursor]


async def get_active_session(user_email: str) -> Optional[dict]:
    """Lets the extension auto-discover 'the session currently running for
    this user' without the popup asking them to paste a session ID."""
    session = await sessions_collection().find_one(
        {"user_email": user_email, "status": "active"}, sort=[("started_at", -1)]
    )
    return _to_session_out(session) if session else None


async def dashboard_summary(user_email: str) -> dict:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    cursor = reports_collection().find({"user_email": user_email, "created_at": {"$gte": today_start}})
    reports_today = [r async for r in cursor]

    total_study = sum(r["duration_seconds"] for r in reports_today)
    total_distracted = sum(r["distracted_seconds"] for r in reports_today)
    total_focused = sum(r["focused_seconds"] for r in reports_today)
    combined = total_focused + total_distracted
    today_focus_score = round((total_focused / combined) * 100, 1) if combined else 0.0

    recent = await list_sessions(user_email, limit=5)

    return {
        "today_study_seconds": total_study,
        "today_focus_score": today_focus_score,
        "today_distracted_seconds": total_distracted,
        "today_session_count": len(reports_today),
        "recent_sessions": recent,
    }


def _to_session_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "subject": doc["subject"],
        "goal": doc["goal"],
        "planned_duration_seconds": doc["planned_duration_seconds"],
        "status": doc["status"],
        "started_at": doc["started_at"],
        "ended_at": doc.get("ended_at"),
        "goal_completed": doc.get("goal_completed"),
        "tasks": doc.get("tasks", []),
    }


def _to_report_out(doc: dict) -> dict:
    return {
        "session_id": doc["session_id"],
        "subject": doc["subject"],
        "goal": doc["goal"],
        "planned_duration_seconds": doc["planned_duration_seconds"],
        "duration_seconds": doc["duration_seconds"],
        "focused_seconds": doc["focused_seconds"],
        "distracted_seconds": doc["distracted_seconds"],
        "tab_switches": doc["tab_switches"],
        "websites": doc["websites"],
        "focus_score": doc["focus_score"],
        "classification": doc["classification"],
        "goal_completed": doc.get("goal_completed"),
        "ai_insight": doc.get("ai_insight"),
    }
