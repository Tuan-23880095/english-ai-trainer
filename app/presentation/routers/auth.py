#\app\presentation\routers\auth.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.repository.memory import UserRepoMem
from app.domain.models import User

router = APIRouter(prefix="/auth", tags=["auth"])
repo = UserRepoMem()

class _Cred(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(body: _Cred):
    user = repo.get_by_email(body.email)
    if not user or user.hashed_password != body.password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai thông tin đăng nhập")
    return {"ok": True}

@router.post("/register")
def register(body: _Cred):
    if repo.get_by_email(body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email đã tồn tại")
    user = User(email=body.email, hashed_password=body.password)
    repo.add(user)
    return {"ok": True}
