 # app/repository/sqlite.py
from typing import List, Optional
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.domain.models import User, Exercise, Result
from app.repository.abc import IUserRepo, IExerciseRepo, IResultRepo
from app.config.config import get_settings
settings = get_settings()
engine = create_engine(settings.db_url, echo=False, future=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

# ---------- ORM mapping ----------
class _UserORM(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    fullname = Column(String)
    dob = Column(String)
    phone = Column(String)
    hobbies = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class _ExerciseORM(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True)
    prompt = Column(String)
    answer = Column(String)
    created_by = Column(Integer)

class _ResultORM(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    score = Column(Float)
    feedback = Column(String)
    submitted_at = Column(DateTime, default=datetime.utcnow)

# ---------- Helper chuyển đổi ----------
def _to_user(u: _UserORM) -> User:
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

# -------------------------------------------------
def _to_ex(ex: _ExerciseORM) -> Exercise:
    return Exercise(
        id=ex.id,
        prompt=ex.prompt,
        answer=ex.answer,
        created_by=ex.created_by,
    )

def _to_res(r: _ResultORM) -> Result:
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
        row = self.db.query(_UserORM).filter_by(email=email).first()
        return _to_user(row) if row else None

    def add(self, user: User):
        row = _UserORM(email=user.email, hashed_password=user.hashed_password)
        self.db.add(row); self.db.commit(); self.db.refresh(row)
        return _to_user(row)
     
    def update_profile(self, user_id, fullname, dob, phone, hobbies):
        user = self.db.query(_UserORM).filter(_UserORM.id == user_id).first()
        if user:
            user.fullname = fullname
            user.dob = dob
            user.phone = phone
            user.hobbies = hobbies
            self.db.commit()
            self.db.refresh(user)
            return _to_user(user)
        return None

# ExerciseRepoSQL – triển khai IExerciseRepo
# -------------------------------------------------
class ExerciseRepoSQL(IExerciseRepo):
    def __init__(self, db: Session):
        self.db = db

    # Lấy toàn bộ bài tập
    def list_all(self):
        rows = self.db.query(_ExerciseORM).all()
        return [_to_ex(row) for row in rows]

    # Lấy một bài tập theo id
    def get(self, ex_id: int):
        row = self.db.query(_ExerciseORM).get(ex_id)
        return _to_ex(row) if row else None

    # Thêm mới bài tập
    def add(self, ex: Exercise):
        row = _ExerciseORM(
            prompt=ex.prompt,
            answer=ex.answer,
            created_by=ex.created_by,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return _to_ex(row)

# -------------------------------------------------
# ResultRepoSQL – triển khai IResultRepo
# -------------------------------------------------
class ResultRepoSQL(IResultRepo):
    def __init__(self, db: Session):
        self.db = db

    # Ghi kết quả nộp bài
    def add(self, res: Result):
        row = _ResultORM(
            user_id=res.user_id,
            exercise_id=res.exercise_id,
            score=res.score,
            feedback=res.feedback,
            submitted_at=res.submitted_at,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return _to_res(row)
# ---------- Hàm tiện ích ----------
def migrate():
    Base.metadata.create_all(engine)

