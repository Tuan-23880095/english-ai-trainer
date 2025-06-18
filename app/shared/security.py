# app\shared\security.py
from fastapi import Request, HTTPException, status
from app.repository.memory import UserRepoMem

repo = UserRepoMem()
def simple_auth(request: Request):
    email = request.headers.get("x-email")
    password = request.headers.get("x-password")
    if not email or not password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Thiếu thông tin đăng nhập")
    user = repo.get_by_email(email)
    if not user or user.hashed_password != password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai thông tin đăng nhập")
    return user
