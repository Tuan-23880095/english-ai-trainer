 # app/domain/models.py
from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from app.config.config import get_settings
settings = get_settings()          # luôn lấy cùng một instance


class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    dob:       Optional[datetime] = None   # import date từ datetime
    hobbies:   Optional[str] = None
    phone:     Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    created_at: datetime = Field(default_factory=datetime.utcnow)

class Exercise(BaseModel):
    id: Optional[int] = None
    prompt: str                   # câu hỏi/bài tập
    answer: str                   # đáp án chuẩn
    created_by: int               # user id (admin/teacher)

class Result(BaseModel):
    id: Optional[int] = None
    user_id: int
    exercise_id: int
    score: float
    feedback: str                 # phản hồi AI
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

