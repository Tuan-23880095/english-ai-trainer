# app\shared\security.py
from fastapi import Request, HTTPException, status, Depends
from app.repository.sqlite import UserRepoSQL, SessionLocal

def get_user_repo():
    db = SessionLocal()
    try:
        yield UserRepoSQL(db)
    finally:
        db.close()

def simple_auth(request: Request, repo=Depends(get_user_repo)):
    # Read authentication from cookies instead of headers
    email = request.cookies.get("user_email")
    password = request.cookies.get("user_password")
    
    if not email or not password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Thiếu thông tin đăng nhập")
    
    user = repo.get_by_email(email)
    if not user or user.hashed_password != password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai thông tin đăng nhập")
    
    return user
