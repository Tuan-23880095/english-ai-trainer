# tests/unit/test_auth.py
import pytest
from app.repository.memory import UserRepoMem
from app.service.auth_service import AuthService

def test_register_and_login():
    svc = AuthService(UserRepoMem())
    user = svc.register("a@b.com", "123")
    assert user.id == 1
    token = svc.login("a@b.com", "123")
    assert token
    with pytest.raises(ValueError):
        svc.login("a@b.com", "wrong")
