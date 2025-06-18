# app/service/profile_service.py

from app.domain.models import User
from app.repository.abc import IUserRepo

class ProfileService:
    def __init__(self, repo: IUserRepo):
        self.repo = repo

    def update_profile(self, user_id: int, data: dict) -> User:
        """
        Cập nhật profile của user theo user_id, sử dụng repository truyền vào.
        """
        return self.repo.update_profile(
            user_id=user_id,
            full_name=data.get('full_name'),
            dob=data.get('dob'),
            phone=data.get('phone'),
            hobbies=data.get('hobbies')
        )
