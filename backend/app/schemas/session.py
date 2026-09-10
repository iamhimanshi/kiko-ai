from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


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

    @field_validator("subject", "goal")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty")
        return v

    @field_validator("tasks")
    @classmethod
    def clean_tasks(cls, v: List[str]) -> List[str]:
        return [t.strip() for t in v if t and t.strip()]


class SessionResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    goal: str
    duration_minutes: int
    tasks: List[TaskSchema]
    status: str
    created_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    paused_at: Optional[datetime]
    paused_duration_seconds: int
    actual_duration_seconds: Optional[int]
    completed_tasks: int
    total_tasks: int
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

    