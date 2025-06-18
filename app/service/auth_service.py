# app/service/auth_service.py
from app.repository.abc import IUserRepo
from app.domain.models import User
from app.shared import security

class AuthService:
    def __init__(self, repo: IUserRepo):
        self.repo = repo

    def register(self, email: str, pwd: str):
        if self.repo.get_by_email(email):
            raise ValueError("Email exists")
        user = User(email=email, hashed_password=security.hash_pwd(pwd))
        user = self.repo.add(user)
        return security.make_token(user.id)

    def login(self, email: str, pwd: str):
        user = self.repo.get_by_email(email)
        if not user or not security.verify_pwd(pwd, user.hashed_password):
            raise ValueError("Invalid credential")
        return security.make_token(user.id)
