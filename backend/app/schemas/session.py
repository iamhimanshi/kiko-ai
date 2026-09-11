from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TaskSchema(BaseModel):
    id: str
    text: str
    is_completed: bool = False
    order: int = 0


class SessionCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=120)
    goal: str = Field(..., min_length=1, max_length=500)
    duration_minutes: int = Field(..., ge=1, le=480)
    tasks: List[str] = Field(default_factory=list)
    mode: str = "continuous"
    work_duration_minutes: Optional[int] = None
    break_duration_minutes: Optional[int] = None


class SessionResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    goal: str
    duration_minutes: int
    mode: Optional[str] = "continuous"
    work_duration_minutes: Optional[int] = None
    break_duration_minutes: Optional[int] = None
    tasks: List[TaskSchema] = []
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    paused_duration_seconds: Optional[int] = 0
    actual_duration_seconds: Optional[int] = None
    completed_tasks: Optional[int] = 0
    total_tasks: Optional[int] = 0
    focus_score: Optional[int] = None
    focused_minutes: Optional[int] = None
    distracted_minutes: Optional[int] = None
    longest_focus_minutes: Optional[int] = None
    ai_insights: Optional[str] = None

    class Config:
        from_attributes = True


class TaskToggleResponse(BaseModel):
    task_id: str
    is_completed: bool
    completed_tasks: int
    total_tasks: int


class EndSessionResponse(BaseModel):
    session: SessionResponse
    message: str