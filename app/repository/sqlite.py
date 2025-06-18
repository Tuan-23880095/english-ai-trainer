# app/repository/sqlite.py

from typing import List, Optional
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.domain.models import User, Exercise, Result, Conversation, Base
from app.repository.abc import IUserRepo, IExerciseRepo, IResultRepo
from app.config.config import get_settings

settings = get_settings()
engine = create_engine(settings.db_url, echo=False, future=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
# KHÔNG tạo lại Base nữa (dùng Base từ models.py)

# ---------- Helper chuyển đổi ----------
def _to_user(u):
    return User(
        id=u.id,
        email=u.email,
        hashed_password=u.hashed_password,
        fullname=u.fullname,
        dob=u.dob,
        phone=u.phone,
        hobbies=u.hobbies,
        created_at=u.created_at
    )

def _to_ex(ex):
    return Exercise(
        id=ex.id,
        prompt=ex.prompt,
        answer=ex.answer,
        created_by=ex.created_by,
    )

def _to_res(r):
    return Result(
        id=r.id,
        user_id=r.user_id,
        exercise_id=r.exercise_id,
        score=r.score,
        feedback=r.feedback,
        submitted_at=r.submitted_at,
    )

# ---------- Repo implementation ----------

class UserRepoSQL(IUserRepo):
    def __init__(self, db: Session): self.db = db

    def get_by_email(self, email: str):
        row = self.db.query(User).filter_by(email=email).first()
        return _to_user(row) if row else None

    def add(self, user: User):
        row = User(
            email=user.email,
            hashed_password=user.hashed_password,
            fullname=user.fullname,
            dob=user.dob,
            phone=user.phone,
            hobbies=user.hobbies,
            created_at=user.created_at or datetime.utcnow()
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return _to_user(row)

    def update_profile(self, user_id, fullname, dob, phone, hobbies):
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.fullname = fullname
            user.dob = dob
            user.phone = phone
            user.hobbies = hobbies
            self.db.commit()
            self.db.refresh(user)
            return _to_user(user)
        return None

class ExerciseRepoSQL(IExerciseRepo):
    def __init__(self, db: Session): self.db = db

    def list_all(self):
        rows = self.db.query(Exercise).all()
        return [_to_ex(row) for row in rows]

    def get(self, ex_id: int):
        row = self.db.query(Exercise).get(ex_id)
        return _to_ex(row) if row else None

    def add(self, ex: Exercise):
        row = Exercise(
            prompt=ex.prompt,
            answer=ex.answer,
            created_by=ex.created_by,
            created_at=ex.created_at or datetime.utcnow()
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return _to_ex(row)

class ResultRepoSQL(IResultRepo):
    def __init__(self, db: Session): self.db = db

    def add(self, res: Result):
        row = Result(
            user_id=res.user_id,
            exercise_id=res.exercise_id,
            score=res.score,
            feedback=res.feedback,
            submitted_at=res.submitted_at or datetime.utcnow()
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return _to_res(row)

# ---------- Repo lưu lịch sử hội thoại ----------
class ConversationRepoSQL:
    def __init__(self, db: Session):
        self.db = db

    def add_message(self, user_id, session_id, role, text):
        row = Conversation(
            user_id=user_id,
            session_id=session_id,
            role=role,
            text=text,
            timestamp=datetime.utcnow()
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def get_history(self, user_id, session_id=None):
        q = self.db.query(Conversation).filter(Conversation.user_id == user_id)
        if session_id:
            q = q.filter(Conversation.session_id == session_id)
        return q.order_by(Conversation.timestamp).all()

# ---------- Hàm tiện ích ----------
def migrate():
    Base.metadata.create_all(engine)
