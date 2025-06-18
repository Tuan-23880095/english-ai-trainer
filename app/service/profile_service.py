#app/service/profile_service.py
from app.repository.abc import IUserRepo
from app.domain.models import User

class ProfileService:
    def __init__(self, repo: IUserRepo):
        self.repo = repo

    def update(self, user_id: int, **kwargs) -> User:
        user = self.repo._store.get(user_id)          # dùng repo memory demo
        for k, v in kwargs.items():
            setattr(user, k, v)
        return user
