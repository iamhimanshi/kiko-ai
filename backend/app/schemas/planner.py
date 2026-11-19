from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SubjectInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    priority: int = Field(3, ge=1, le=5)
    prep_level: str = Field("beginner", pattern="^(beginner|intermediate|advanced)$")
    topics: List[str] = Field(default_factory=list)


class CreatePlanRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    goal: str = Field(..., min_length=2, max_length=500)
    exam_date: date
    daily_hours: float = Field(3.0, ge=0.5, le=14.0)
    preferred_block_minutes: int = Field(45, ge=15, le=120)
    subjects: List[SubjectInput] = Field(..., min_length=1)


class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|completed|skipped)$")
    linked_session_id: Optional[int] = None


class TaskRescheduleRequest(BaseModel):
    scheduled_date: date


class AgentCommandRequest(BaseModel):
    command: str = Field(..., min_length=2, max_length=500)


class AgentConfirmRequest(BaseModel):
    intent: str = Field(..., min_length=2, max_length=80)
    params: Dict[str, Any] = Field(default_factory=dict)