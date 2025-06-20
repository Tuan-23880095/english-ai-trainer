# app/domain/models.py

# app/domain/models.py

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

# ORM base
Base = declarative_base()

# ---------------------------
# ORM models (làm việc với DB)
# ---------------------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    fullname = Column(String)
    dob = Column(String)
    hobbies = Column(String)
    phone = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    score = Column(Float)
    feedback = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)

# ---------------------------
# Lịch sử hội thoại (Conversation)
# ---------------------------
class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    role = Column(String)     # "user" hoặc "ai"
    text = Column(String)

# ---------------------------
# Pydantic models (dùng cho API)
# ---------------------------

class UserSchema(BaseModel):
    id: Optional[int]
    email: EmailStr
    fullname: Optional[str]
    dob: Optional[str]
    hobbies: Optional[str]
    phone: Optional[str]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    fullname: Optional[str]
    dob: Optional[str]
    hobbies: Optional[str]
    phone: Optional[str]

class UserUpdate(BaseModel):
    fullname: Optional[str]
    dob: Optional[str]
    hobbies: Optional[str]
    phone: Optional[str]

class ExerciseSchema(BaseModel):
    id: Optional[int]
    prompt: str
    answer: str
    created_by: int
    created_at: Optional[datetime]
    class Config:
        orm_mode = True

class ResultSchema(BaseModel):
    id: Optional[int]
    user_id: int
    exercise_id: int
    score: float
    feedback: str
    submitted_at: Optional[datetime]
    class Config:
        orm_mode = True

# (Có thể thêm ConversationSchema nếu muốn xuất API lịch sử chat)
class ConversationSchema(BaseModel):
    id: Optional[int]
    user_id: int
    session_id: str
    timestamp: datetime
    role: str
    text: str

    class Config:
        orm_mode = True

