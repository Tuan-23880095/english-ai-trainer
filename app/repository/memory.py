 # app/repository/memory.py
from typing import Dict, List
from itertools import count
from app.domain.models import User, Exercise, Result
from .abc import IUserRepo, IExerciseRepo, IResultRepo
from app.config.config import get_settings
settings = get_settings()          # luôn lấy cùng một instance
class _AutoID:
    _counter = count(1)
    @classmethod
    def next(cls): return next(cls._counter)

class UserRepoMem(IUserRepo):
    def __init__(self) -> None:
        self._store: Dict[int, User] = {}

    def get_by_email(self, email: str):
        return next((u for u in self._store.values() if u.email == email), None)

    def add(self, user: User):
        user.id = _AutoID.next()
        self._store[user.id] = user
        return user

class ExerciseRepoMem(IExerciseRepo):
    _data: Dict[int, Exercise] = {}

    def list_all(self): 
        return self._data.values()

    def get(self, ex_id: int): 
        return self._data.get(ex_id)

    def add(self, ex: Exercise):
        ex.id = _AutoID.next()
        self._data[ex.id] = ex
        return ex


class ResultRepoMem(IResultRepo):
    _data: Dict[int, Result] = {}

    def add(self, r: Result):
        r.id = _AutoID.next()
        self._data[r.id] = r
        return r
