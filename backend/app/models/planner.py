from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String, nullable=False)
    goal = Column(Text, nullable=False)
    exam_date = Column(Date, nullable=False)
    daily_hours = Column(Float, nullable=False, default=3.0)
    preferred_block_minutes = Column(Integer, nullable=False, default=45)
    status = Column(String, nullable=False, default="active")  # active | completed | archived

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    subjects = relationship("PlanSubject", back_populates="plan", cascade="all, delete-orphan")
    tasks = relationship("PlannedTask", back_populates="plan", cascade="all, delete-orphan")
    recommendations = relationship("PlannerRecommendation", back_populates="plan", cascade="all, delete-orphan")


class PlanSubject(Base):
    __tablename__ = "plan_subjects"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False)
    difficulty = Column(String, nullable=False, default="medium")  # easy | medium | hard
    priority = Column(Integer, nullable=False, default=3)  # 1 (low) - 5 (high)
    prep_level = Column(String, nullable=False, default="beginner")  # beginner | intermediate | advanced
    topics = Column(JSON, default=list)
    color = Column(String, nullable=False, default="#FF841C")

    plan = relationship("StudyPlan", back_populates="subjects")
    tasks = relationship("PlannedTask", back_populates="subject", cascade="all, delete-orphan")


class PlannedTask(Base):
    __tablename__ = "planned_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("plan_subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    scheduled_date = Column(Date, nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=45)
    priority = Column(Integer, nullable=False, default=3)
    status = Column(String, nullable=False, default="pending")  # pending | completed | skipped
    linked_session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    plan = relationship("StudyPlan", back_populates="tasks")
    subject = relationship("PlanSubject", back_populates="tasks")


class StudentPlannerProfile(Base):
    __tablename__ = "student_planner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    preferred_block_minutes = Column(Integer, nullable=False, default=45)
    peak_time_slot = Column(String, nullable=False, default="evening")
    avg_completion_rate = Column(Float, nullable=False, default=1.0)
    learned_patterns = Column(JSON, default=dict)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PlannerRecommendation(Base):
    __tablename__ = "planner_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    observation = Column(Text, nullable=False)
    suggestion = Column(Text, nullable=False)
    action_type = Column(String, nullable=False, default="tip")  # split_blocks | reschedule | prioritize | tip
    action_payload = Column(JSON, default=dict)
    status = Column(String, nullable=False, default="pending")  # pending | applied | dismissed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan = relationship("StudyPlan", back_populates="recommendations")