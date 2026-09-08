from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class BehaviorEvent(Base):
    __tablename__ = "behavior_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False)

    # Website data
    url = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    page_title = Column(String, nullable=True)

    # Behavior metrics
    time_spent_seconds = Column(Integer, nullable=False)
    tab_switches = Column(Integer, default=0)
    idle_seconds = Column(Integer, default=0)
    scroll_events = Column(Integer, default=0)
    mouse_events = Column(Integer, default=0)
    keyboard_events = Column(Integer, default=0)

    # Classification
    is_distracting = Column(Boolean, default=False)
    distraction_reason = Column(String, nullable=True)
    focus_state = Column(String, nullable=True)

    # Timestamp
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Raw events (for future ML)
    raw_events = Column(JSON, nullable=True)

    # Relationships
    session = relationship("StudySession", back_populates="events")

    