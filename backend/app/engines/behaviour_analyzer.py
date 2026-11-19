"""
Behaviour Analyzer for DayDive AI Study Planner.
Evaluates real StudySession & BehaviorEvent history alongside PlannedTasks
to detect focus patterns and propose actionable schedule adaptations.
"""
from datetime import date, datetime, timezone, timedelta
from typing import List, Dict
from collections import defaultdict


def _slot_for_dt(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    h = dt.hour
    if 6 <= h < 12:
        return "morning"
    if 12 <= h < 18:
        return "afternoon"
    if 18 <= h < 24:
        return "evening"
    return "night"


def analyze_behaviour(
    sessions: list,
    events: list,
    plan_dict: dict,
) -> Dict:
    """
    Returns:
    {
      "metrics": { avg_completion_ratio, avg_distractions, peak_time_slot, overdue_count },
      "candidates": [ { observation, suggestion, action_type, action_payload } ]
    }
    """
    today = date.today()
    completed_sessions = [s for s in sessions if s.status == "COMPLETED"]

    # 1. Planned vs actual duration ratio
    ratios = []
    for s in completed_sessions:
        planned = (s.duration_minutes or 0) * 60
        actual = s.actual_duration_seconds or 0
        if planned > 0 and actual > 0:
            ratios.append(min(actual / planned, 1.5))
    avg_ratio = round(sum(ratios) / len(ratios), 2) if ratios else 1.0

    # 2. Distraction events per session & peak time slot
    events_by_session = defaultdict(list)
    slot_stats = defaultdict(lambda: {"focused": 0, "total": 0})
    for e in events:
        events_by_session[e.session_id].append(e)
        sec = e.time_spent_seconds or 0
        if e.recorded_at and sec > 0:
            slot = _slot_for_dt(e.recorded_at)
            slot_stats[slot]["total"] += sec
            if e.focus_state == "focused" and not e.is_distracting:
                slot_stats[slot]["focused"] += sec

    distraction_counts = [
        sum(1 for e in events_by_session[s.id] if e.is_distracting)
        for s in completed_sessions
    ]
    avg_distractions = (
        round(sum(distraction_counts) / len(distraction_counts), 1)
        if distraction_counts
        else 0.0
    )

    peak_slot = "evening"
    best_pct = -1.0
    for slot, st in slot_stats.items():
        if st["total"] > 0:
            pct = st["focused"] / st["total"]
            if pct > best_pct:
                best_pct = pct
                peak_slot = slot

    # 3. Overdue & pending tasks
    tasks = plan_dict.get("tasks", []) if plan_dict else []
    overdue_tasks = [t for t in tasks if t.get("is_overdue")]
    pending_tasks = [t for t in tasks if t.get("status") == "pending"]
    long_pending = [t for t in pending_tasks if (t.get("duration_minutes") or 0) >= 45]

    candidates: List[Dict] = []

    # Rule A: Shorten long blocks when focus drops or distractions spike
    if (completed_sessions and (avg_ratio < 0.78 or avg_distractions >= 3.5)) and long_pending:
        candidates.append({
            "observation": (
                f"Across recent sessions, you averaged {int(avg_ratio * 100)}% of planned duration "
                f"with {avg_distractions} distraction events per session."
            ),
            "suggestion": (
                "Split upcoming 45+ minute study blocks into 30-minute focused sprints "
                "to maintain higher completion and lower distraction drift."
            ),
            "action_type": "split_blocks",
            "action_payload": {"target_duration": 30},
        })

    # Rule B: Reschedule overdue tasks forward
    if len(overdue_tasks) >= 1:
        candidates.append({
            "observation": f"You currently have {len(overdue_tasks)} overdue study task(s) from earlier dates.",
            "suggestion": "Shift overdue pending tasks forward starting today so your daily plan stays realistic.",
            "action_type": "reschedule_overdue",
            "action_payload": {"target_date": today.isoformat(), "count": len(overdue_tasks)},
        })

    # Rule C: Exam urgency boost
    days_left = plan_dict.get("days_left", 99) if plan_dict else 99
    completion_rate = plan_dict.get("completion_rate", 100) if plan_dict else 100
    if days_left <= 7 and completion_rate < 65 and pending_tasks:
        candidates.append({
            "observation": f"Your target date is {days_left} day(s) away with {completion_rate}% of tasks completed.",
            "suggestion": "Elevate priority on remaining pending tasks so high-impact topics stay at the top.",
            "action_type": "prioritize_exam",
            "action_payload": {"priority": 5},
        })

    # Rule D: Peak time-of-day coaching tip
    if best_pct >= 0:
        candidates.append({
            "observation": f"Your highest focus ratio ({int(best_pct * 100)}%) occurs during the {peak_slot}.",
            "suggestion": f"Schedule your hardest subjects during the {peak_slot} window whenever possible.",
            "action_type": "tip",
            "action_payload": {"peak_time_slot": peak_slot},
        })
    elif not candidates:
        candidates.append({
            "observation": "Your study plan is on track with no overdue tasks or major distraction spikes.",
            "suggestion": "Keep logging Study Sessions so DayDive can fine-tune your block durations over time.",
            "action_type": "tip",
            "action_payload": {},
        })

    return {
        "metrics": {
            "avg_completion_ratio": avg_ratio,
            "avg_distractions": avg_distractions,
            "peak_time_slot": peak_slot,
            "overdue_count": len(overdue_tasks),
            "sessions_analyzed": len(completed_sessions),
        },
        "candidates": candidates,
    }