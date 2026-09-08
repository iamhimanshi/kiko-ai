import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Session details
    goal = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    tasks = Column(JSON, default=list)

    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)

    # Status
    status = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE)

    # Analytics
    focus_score = Column(Float, nullable=True)
    focused_minutes = Column(Integer, nullable=True)
    distracted_minutes = Column(Integer, nullable=True)
    longest_focus_minutes = Column(Integer, nullable=True)

    # AI Insights
    ai_insights = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    events = relationship("BehaviorEvent", back_populates="session", cascade="all, delete-orphan")

    