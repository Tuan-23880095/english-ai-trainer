#\app\presentation\routers\auth.py
from fastapi import APIRouter, HTTPException, status, Depends, Response
from pydantic import BaseModel, EmailStr
from app.repository.sqlite import UserRepoSQL, SessionLocal
from app.domain.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

def get_user_repo():
    db = SessionLocal()
    try:
        yield UserRepoSQL(db)
    finally:
        db.close()

class _Cred(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(body: _Cred, response: Response, repo=Depends(get_user_repo)):
    user = repo.get_by_email(body.email)
    if not user or user.hashed_password != body.password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai thông tin đăng nhập")
    
    # Set cookies for authentication
    response.set_cookie(key="user_email", value=body.email, httponly=True, max_age=3600)  # 1 hour
    response.set_cookie(key="user_password", value=body.password, httponly=True, max_age=3600)  # 1 hour
    
    return {"ok": True}

@router.post("/logout")
def logout(response: Response):
    # Clear authentication cookies
    response.delete_cookie(key="user_email")
    response.delete_cookie(key="user_password")
    return {"ok": True}

@router.post("/register")
def register(body: _Cred, repo=Depends(get_user_repo)):
    if repo.get_by_email(body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email đã tồn tại")
    user = User(email=body.email, hashed_password=body.password)
    repo.add(user)
    return {"ok": True}
