from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class TaskInput(BaseModel):
    text: str = Field(min_length=1, max_length=200)


class Task(BaseModel):
    text: str
    done: bool = False


class CreateSessionRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=100)
    goal: str = Field(min_length=1, max_length=300)
    planned_duration_seconds: int = Field(ge=60, le=6 * 3600)
    tasks: List[TaskInput] = Field(default_factory=list)


class SessionOut(BaseModel):
    id: str
    subject: str
    goal: str
    planned_duration_seconds: int
    status: Literal["active", "completed"]
    started_at: datetime
    ended_at: Optional[datetime] = None
    goal_completed: Optional[bool] = None
    tasks: List[Task]


class ActivityEventInput(BaseModel):
    domain: str
    page_title: str = ""
    duration_seconds: int = Field(ge=0, le=3600)
    tab_switch: bool = False


class ActivityBatchRequest(BaseModel):
    events: List[ActivityEventInput]


class ActivityBatchResponse(BaseModel):
    accepted: int
    latest_classification: Optional[str] = None
    distraction_warning: bool = False
    warning_reason: Optional[str] = None


class EndSessionRequest(BaseModel):
    goal_completed: Optional[bool] = None


class WebsiteBreakdown(BaseModel):
    domain: str
    seconds: int
    classification: str


class SessionReportOut(BaseModel):
    session_id: str
    subject: str
    goal: str
    planned_duration_seconds: int
    duration_seconds: int
    focused_seconds: int
    distracted_seconds: int
    tab_switches: int
    websites: List[WebsiteBreakdown]
    focus_score: float
    classification: str
    goal_completed: Optional[bool] = None
    ai_insight: Optional[str] = None


class ActiveWarning(BaseModel):
    domain: str
    page_title: str
    goal: str


class LiveSessionStatus(BaseModel):
    status: Literal["monitoring", "focused", "distracted"]
    elapsed_seconds: int
    focused_seconds: int
    distracted_seconds: int
    focus_score: float
    active_warning: Optional[ActiveWarning] = None


class DashboardSummary(BaseModel):
    today_study_seconds: int
    today_focus_score: float
    today_distracted_seconds: int
    today_session_count: int
    recent_sessions: List[SessionReportOut]
