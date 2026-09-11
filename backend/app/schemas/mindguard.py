from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ActivityItem(BaseModel):
    url: str
    domain: Optional[str] = None
    page_title: Optional[str] = None
    time_spent_seconds: int = Field(..., ge=0)
    tab_switches: int = 0
    idle_seconds: int = 0
    mouse_events: int = 0
    keyboard_events: int = 0
    scroll_events: int = 0
    was_blocked: bool = False 


class ActivityBatchRequest(BaseModel):
    session_id: Optional[int] = None
    activities: List[ActivityItem]


class ActivityClassification(BaseModel):
    url: str
    domain: str
    page_title: Optional[str] = None
    classification: str
    focus_state: str
    reason: str
    time_spent_seconds: int
    intervention_level: int
    intervention_title: Optional[str] = None
    intervention_message: Optional[str] = None


class ActivityBatchResponse(BaseModel):
    session_id: int
    results: List[ActivityClassification]


class CurrentActivity(BaseModel):
    url: Optional[str] = None
    domain: Optional[str] = None
    page_title: Optional[str] = None
    classification: Optional[str] = None
    focus_state: Optional[str] = None
    reason: Optional[str] = None
    time_on_page_seconds: Optional[int] = None
    recorded_at: Optional[datetime] = None


class RecentActivityItem(BaseModel):
    url: str
    domain: str
    page_title: Optional[str] = None
    classification: str
    focus_state: str
    time_spent_seconds: int
    recorded_at: datetime


class MindGuardStatusResponse(BaseModel):
    has_active_session: bool
    session_id: Optional[int] = None
    subject: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    remaining_seconds: Optional[int] = None
    current_focus_state: str  # focused | attention | distracted | idle | paused
    current_activity: Optional[CurrentActivity] = None
    extension_connected: bool
    last_activity_at: Optional[datetime] = None
    distraction_count: int = 0
    distraction_seconds: int = 0
    focused_seconds: int = 0
    longest_focus_seconds: int = 0


class LiveMonitorResponse(BaseModel):
    has_active_session: bool
    session_id: Optional[int] = None
    subject: Optional[str] = None
    goal: Optional[str] = None
    current_activity: Optional[CurrentActivity] = None
    recent_activity: List[RecentActivityItem] = []
    recent_distractions: List[RecentActivityItem] = []


class ExtensionStatusResponse(BaseModel):
    connected: bool
    last_seen_at: Optional[datetime] = None
    active_session_id: Optional[int] = None
    version: str = "1.0"

# ─── Blocked Websites ───
class BlockedWebsiteCreate(BaseModel):
    domain: str = Field(..., min_length=3, max_length=253)


class BlockedWebsiteResponse(BaseModel):
    id: int
    domain: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

