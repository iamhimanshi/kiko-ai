from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class PracticeRecord(Base):
    __tablename__ = "practice_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    document_name = Column(String, nullable=True)

    type = Column(String, nullable=False)  # "flashcards" | "quiz"
    data = Column(JSON, default=list)      # cards or questions
    count = Column(Integer, default=0)
    difficulty = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())