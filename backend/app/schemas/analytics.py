from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: str
    raw: float
    change_pct: Optional[float] = None


class OverviewResponse(BaseModel):
    range: str
    total_study_seconds: int
    total_paused_seconds: int
    total_focused_seconds: int
    total_distracted_seconds: int
    focus_score: int
    sessions_count: int
    completed_sessions: int
    distraction_count: int
    longest_focus_seconds: int
    top_websites: List[dict]
    top_distracting: List[dict]
    recent_sessions: List[dict]
    daily_focus: List[dict]  # [{date, focus_seconds, distraction_seconds, sessions}]
    has_data: bool


class FocusTrendsResponse(BaseModel):
    range: str
    has_data: bool
    daily: List[dict]
    best_time_of_day: Optional[dict] = None


class SessionReportResponse(BaseModel):
    session: dict
    metrics: dict
    focus_timeline: List[dict]
    website_activity: List[dict]
    distraction_events: List[dict]
    blocked_attempts: List[dict]
    ai_insights: Optional[str] = None
    