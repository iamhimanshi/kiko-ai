from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)

    # pages: [{"number": 1, "text": "..."}, ...]
    pages = Column(JSON, default=list)
    # chunks: [{"text": "...", "page": 1, "index": 0}, ...]
    chunks = Column(JSON, default=list)

    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)

    status = Column(String, default="ready", nullable=False)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="documents")

    