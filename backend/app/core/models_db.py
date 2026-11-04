from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON
from backend.app.core.db import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    consent = Column(Boolean, nullable=False)
    age_group = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    grade = Column(String(50), nullable=True)
    scored_answers = Column(JSON, nullable=False)
    quotient_scores = Column(JSON, nullable=False)
    rule_profile_id = Column(Integer, nullable=False)
    model_profile_id = Column(Integer, nullable=False)
    model_version = Column(String(100), nullable=False)

