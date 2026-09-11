"""
Analytics engine + service.
- Deterministic calculations (no AI here).
- AI insight generation on session end (uses ai_service).
"""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from collections import defaultdict

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import StudySession, SessionStatus
from app.models.behavior import BehaviorEvent
from app.services import ai_service


# ──────────────────────── Range helpers ────────────────────────

def _range_start(range_type: str) -> Optional[datetime]:
    now = datetime.now(timezone.utc)
    if range_type == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    if range_type == "7d":
        return now - timedelta(days=7)
    if range_type == "30d":
        return now - timedelta(days=30)
    if range_type == "90d":
        return now - timedelta(days=90)
    return None  # all-time


def _day_key(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")


# ──────────────────────── Focus streak ────────────────────────

def _longest_focus_streak(events: List[BehaviorEvent]) -> int:
    longest = 0
    streak = 0
    for e in events:
        if e.focus_state == "focused":
            streak += e.time_spent_seconds or 0
            longest = max(longest, streak)
        else:
            streak = 0
    return longest


def _build_focus_timeline(events: List[BehaviorEvent]) -> List[dict]:
    """Return sequential focus segments."""
    timeline = []
    for e in events:
        state = "distracted" if e.is_distracting else (
            "focused" if e.focus_state == "focused" else "uncertain"
        )
        timeline.append({
            "state": state,
            "seconds": e.time_spent_seconds or 0,
            "domain": e.domain,
            "recorded_at": e.recorded_at.isoformat() if e.recorded_at else None,
        })
    return timeline


# ──────────────────────── Data fetchers ────────────────────────

async def _fetch_sessions(
    db: AsyncSession, user_id: int, since: Optional[datetime]
) -> List[StudySession]:
    q = select(StudySession).where(StudySession.user_id == user_id)
    if since:
        q = q.where(StudySession.created_at >= since)
    q = q.order_by(StudySession.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


async def _fetch_events(
    db: AsyncSession, session_ids: List[int]
) -> List[BehaviorEvent]:
    if not session_ids:
        return []
    result = await db.execute(
        select(BehaviorEvent)
        .where(BehaviorEvent.session_id.in_(session_ids))
        .order_by(BehaviorEvent.recorded_at.asc())
    )
    return list(result.scalars().all())


# ──────────────────────── Overview ────────────────────────

async def compute_overview(
    db: AsyncSession, user_id: int, range_type: str = "7d"
) -> dict:
    since = _range_start(range_type)
    sessions = await _fetch_sessions(db, user_id, since)
    session_ids = [s.id for s in sessions]
    events = await _fetch_events(db, session_ids)

    total_study = sum(s.actual_duration_seconds or 0 for s in sessions)
    total_paused = sum(s.paused_duration_seconds or 0 for s in sessions)
    completed = [s for s in sessions if s.status == SessionStatus.COMPLETED.value]

    focused_seconds = sum(e.time_spent_seconds or 0 for e in events if e.focus_state == "focused")
    distracted_seconds = sum(e.time_spent_seconds or 0 for e in events if e.is_distracting)
    denom = focused_seconds + distracted_seconds
    focus_score = int((focused_seconds / denom) * 100) if denom > 0 else 0

    distraction_events = [e for e in events if e.is_distracting]
    longest_focus = _longest_focus_streak(events)

    # Website stats
    site_stats = defaultdict(lambda: {"seconds": 0, "distraction_seconds": 0, "distraction_count": 0})
    for e in events:
        d = e.domain or "unknown"
        site_stats[d]["seconds"] += e.time_spent_seconds or 0
        if e.is_distracting:
            site_stats[d]["distraction_seconds"] += e.time_spent_seconds or 0
            site_stats[d]["distraction_count"] += 1

    top_websites = [
        {
            "domain": d,
            "seconds": v["seconds"],
            "distraction_seconds": v["distraction_seconds"],
        }
        for d, v in sorted(site_stats.items(), key=lambda x: -x[1]["seconds"])[:10]
    ]

    top_distracting = [
        {
            "domain": d,
            "distraction_count": v["distraction_count"],
            "distraction_seconds": v["distraction_seconds"],
        }
        for d, v in sorted(site_stats.items(), key=lambda x: -x[1]["distraction_seconds"])
        if v["distraction_count"] > 0
    ][:5]

    # Daily aggregation
    daily = defaultdict(lambda: {"focus_seconds": 0, "distraction_seconds": 0, "sessions": 0})
    for s in sessions:
        k = _day_key(s.created_at)
        daily[k]["sessions"] += 1
    for e in events:
        k = _day_key(e.recorded_at)
        if e.is_distracting:
            daily[k]["distraction_seconds"] += e.time_spent_seconds or 0
        elif e.focus_state == "focused":
            daily[k]["focus_seconds"] += e.time_spent_seconds or 0

    daily_list = [
        {"date": k, **v}
        for k, v in sorted(daily.items())
    ]

    # Recent 5 sessions
    recent = [
        {
            "id": s.id,
            "subject": s.subject,
            "goal": s.goal,
            "status": s.status,
            "actual_duration_seconds": s.actual_duration_seconds or 0,
            "completed_tasks": s.completed_tasks or 0,
            "total_tasks": s.total_tasks or 0,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions[:5]
    ]

    return {
        "range": range_type,
        "total_study_seconds": total_study,
        "total_paused_seconds": total_paused,
        "total_focused_seconds": focused_seconds,
        "total_distracted_seconds": distracted_seconds,
        "focus_score": focus_score,
        "sessions_count": len(sessions),
        "completed_sessions": len(completed),
        "distraction_count": len(distraction_events),
        "longest_focus_seconds": longest_focus,
        "top_websites": top_websites,
        "top_distracting": top_distracting,
        "recent_sessions": recent,
        "daily_focus": daily_list,
        "has_data": len(sessions) > 0,
    }


# ──────────────────────── Session Report ────────────────────────

async def compute_session_report(
    db: AsyncSession, user_id: int, session_id: int
) -> Optional[dict]:
    result = await db.execute(
        select(StudySession).where(
            and_(StudySession.id == session_id, StudySession.user_id == user_id)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        return None

    result = await db.execute(
        select(BehaviorEvent)
        .where(BehaviorEvent.session_id == session.id)
        .order_by(BehaviorEvent.recorded_at.asc())
    )
    events = list(result.scalars().all())

    focused_seconds = sum(e.time_spent_seconds or 0 for e in events if e.focus_state == "focused")
    distracted_seconds = sum(e.time_spent_seconds or 0 for e in events if e.is_distracting)
    denom = focused_seconds + distracted_seconds
    focus_score = int((focused_seconds / denom) * 100) if denom > 0 else 0
    longest = _longest_focus_streak(events)
    distractions = [e for e in events if e.is_distracting and not e.was_blocked]
    blocked = [e for e in events if e.was_blocked]

    # Website activity
    site_stats = defaultdict(lambda: {"seconds": 0, "relevant": 0, "distracting": 0, "titles": set()})
    for e in events:
        d = e.domain or "unknown"
        site_stats[d]["seconds"] += e.time_spent_seconds or 0
        if e.is_distracting:
            site_stats[d]["distracting"] += e.time_spent_seconds or 0
        elif e.focus_state == "focused":
            site_stats[d]["relevant"] += e.time_spent_seconds or 0
        if e.page_title:
            site_stats[d]["titles"].add(e.page_title)

    websites = []
    for d, v in sorted(site_stats.items(), key=lambda x: -x[1]["seconds"]):
        status = "relevant" if v["relevant"] >= v["distracting"] else "distracting"
        websites.append({
            "domain": d,
            "seconds": v["seconds"],
            "relevant_seconds": v["relevant"],
            "distracting_seconds": v["distracting"],
            "status": status,
            "sample_title": next(iter(v["titles"])) if v["titles"] else None,
        })

    return {
        "session": {
            "id": session.id,
            "subject": session.subject,
            "goal": session.goal,
            "status": session.status,
            "mode": session.mode,
            "duration_minutes": session.duration_minutes,
            "actual_duration_seconds": session.actual_duration_seconds or 0,
            "paused_duration_seconds": session.paused_duration_seconds or 0,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "tasks": session.tasks or [],
            "completed_tasks": session.completed_tasks or 0,
            "total_tasks": session.total_tasks or 0,
        },
        "metrics": {
            "focus_score": focus_score,
            "focused_seconds": focused_seconds,
            "distracted_seconds": distracted_seconds,
            "longest_focus_seconds": longest,
            "distraction_count": len(distractions),
            "blocked_attempts": len(blocked),
        },
        "focus_timeline": _build_focus_timeline(events),
        "website_activity": websites,
        "distraction_events": [
            {
                "domain": e.domain,
                "page_title": e.page_title,
                "seconds": e.time_spent_seconds or 0,
                "reason": e.distraction_reason,
                "recorded_at": e.recorded_at.isoformat() if e.recorded_at else None,
            }
            for e in distractions
        ],
        "blocked_attempts": [
            {
                "domain": e.domain,
                "page_title": e.page_title,
                "recorded_at": e.recorded_at.isoformat() if e.recorded_at else None,
            }
            for e in blocked
        ],
        "ai_insights": session.ai_insights,
    }


# ──────────────────────── Focus Trends ────────────────────────

async def compute_focus_trends(
    db: AsyncSession, user_id: int, range_type: str = "7d"
) -> dict:
    since = _range_start(range_type) or _range_start("30d")
    sessions = await _fetch_sessions(db, user_id, since)
    events = await _fetch_events(db, [s.id for s in sessions])

    daily = defaultdict(lambda: {"focus_seconds": 0, "distraction_seconds": 0, "sessions": 0})
    for s in sessions:
        k = _day_key(s.created_at)
        daily[k]["sessions"] += 1
    for e in events:
        k = _day_key(e.recorded_at)
        if e.is_distracting:
            daily[k]["distraction_seconds"] += e.time_spent_seconds or 0
        elif e.focus_state == "focused":
            daily[k]["focus_seconds"] += e.time_spent_seconds or 0

    daily_list = [{"date": k, **v} for k, v in sorted(daily.items())]

    # Best time of day (only if 3+ sessions)
    best_time = None
    if len(sessions) >= 3:
        slots = {"morning": [], "afternoon": [], "evening": [], "night": []}
        for s in sessions:
            if not s.created_at:
                continue
            h = s.created_at.astimezone(timezone.utc).hour
            slot = "night" if h < 6 else "morning" if h < 12 else "afternoon" if h < 18 else "evening"
            # Compute rough session focus score
            s_events = [e for e in events if e.session_id == s.id]
            f = sum(e.time_spent_seconds or 0 for e in s_events if e.focus_state == "focused")
            d = sum(e.time_spent_seconds or 0 for e in s_events if e.is_distracting)
            total = f + d
            if total > 0:
                slots[slot].append((f / total) * 100)
        best_time = {}
        for slot, scores in slots.items():
            if scores:
                best_time[slot] = int(sum(scores) / len(scores))

    return {
        "range": range_type,
        "has_data": len(sessions) > 0,
        "daily": daily_list,
        "best_time_of_day": best_time,
    }


# ──────────────────────── Top Distracting Websites ────────────────────────

async def compute_top_distracting(
    db: AsyncSession, user_id: int, range_type: str = "7d"
) -> list:
    since = _range_start(range_type)
    sessions = await _fetch_sessions(db, user_id, since)
    events = await _fetch_events(db, [s.id for s in sessions])

    stats = defaultdict(lambda: {"count": 0, "seconds": 0, "reasons": defaultdict(int)})
    for e in events:
        if not e.is_distracting:
            continue
        d = e.domain or "unknown"
        stats[d]["count"] += 1
        stats[d]["seconds"] += e.time_spent_seconds or 0
        r = e.distraction_reason or "Unrelated content"
        stats[d]["reasons"][r] += 1

    return [
        {
            "domain": d,
            "count": v["count"],
            "seconds": v["seconds"],
            "avg_seconds": int(v["seconds"] / v["count"]) if v["count"] else 0,
            "reasons": [{"reason": r, "count": c} for r, c in sorted(v["reasons"].items(), key=lambda x: -x[1])],
        }
        for d, v in sorted(stats.items(), key=lambda x: -x[1]["count"])[:10]
    ]


# ──────────────────────── AI Insight (on session end) ────────────────────────

INSIGHT_PROMPT = """You are KIKO, a study coach. Based on this session, write a short insight.

Format your reply in this exact structure (plain text, no markdown):

OBSERVATION
<2-3 sentences about what happened>

WHAT WENT WELL
- <point>
- <point>

WHAT TO IMPROVE
- <point>
- <point>

Be honest but encouraging. Don't invent numbers not given.

Session data:
- Subject: {subject}
- Goal: {goal}
- Duration: {duration_min} min
- Focus score: {focus_score}%
- Focused: {focused_min} min
- Distracted: {distracted_min} min
- Longest focus streak: {longest_min} min
- Tasks completed: {tasks_done}/{tasks_total}
- Top distracting sites: {distractions}
- Blocked attempts: {blocked}
"""


async def generate_session_insight(session: StudySession, metrics: dict) -> Optional[str]:
    """Call Groq to produce a short AI insight for a finished session."""
    try:
        prompt = INSIGHT_PROMPT.format(
            subject=session.subject,
            goal=session.goal,
            duration_min=int((session.actual_duration_seconds or 0) / 60),
            focus_score=metrics.get("focus_score", 0),
            focused_min=int(metrics.get("focused_seconds", 0) / 60),
            distracted_min=int(metrics.get("distracted_seconds", 0) / 60),
            longest_min=int(metrics.get("longest_focus_seconds", 0) / 60),
            tasks_done=session.completed_tasks or 0,
            tasks_total=session.total_tasks or 0,
            distractions=", ".join(metrics.get("top_distraction_domains", [])) or "none",
            blocked=metrics.get("blocked_attempts", 0),
        )
        text = await ai_service.generate(prompt, temperature=0.5, max_tokens=600)
        return text.strip()
    except Exception:
        return None


async def generate_and_store_insight(db: AsyncSession, session: StudySession) -> None:
    """Compute metrics + AI insight + store on the session."""
    report = await compute_session_report(db, session.user_id, session.id)
    if not report:
        return

    # Top distraction domains for the prompt
    top_domains = [w["domain"] for w in report["distraction_events"][:3] if w.get("domain")]
    metrics = {
        **report["metrics"],
        "top_distraction_domains": top_domains,
    }

    insight = await generate_session_insight(session, metrics)
    if insight:
        session.ai_insights = insight
        await db.commit()