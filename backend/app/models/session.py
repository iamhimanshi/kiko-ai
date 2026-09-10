import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class SessionStatus(str, enum.Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Planning
    subject = Column(String, nullable=False)
    goal = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)

    # Tasks stored as JSON: [{id, text, is_completed, order}]
    tasks = Column(JSON, default=list)

    # Timing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    paused_duration_seconds = Column(Integer, default=0)
    actual_duration_seconds = Column(Integer, nullable=True)

    # Status
    status = Column(String, default=SessionStatus.ACTIVE.value, nullable=False)

    # Progress
    completed_tasks = Column(Integer, default=0)
    total_tasks = Column(Integer, default=0)

    # Analytics (populated later by Analytics engine)
    focus_score = Column(Integer, nullable=True)
    focused_minutes = Column(Integer, nullable=True)
    distracted_minutes = Column(Integer, nullable=True)
    longest_focus_minutes = Column(Integer, nullable=True)
    ai_insights = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    events = relationship(
        "BehaviorEvent",
        back_populates="session",
        cascade="all, delete-orphan",
    )


# Helper to generate task IDs
def new_task_id() -> str:
    return str(uuid.uuid4())
    