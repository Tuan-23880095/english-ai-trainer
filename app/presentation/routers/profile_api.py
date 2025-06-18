# app/presentation/routers/profile_api.py
from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.shared.security import simple_auth
from app.repository.memory import UserRepoMem
from app.service.profile_service import ProfileService

repo = UserRepoMem()
svc  = ProfileService(repo)

api  = APIRouter(prefix="/me", tags=["profile"])


class _Profile(BaseModel):
    full_name: str
    dob:       date = Field(..., description="YYYY-MM-DD")
    hobbies:   str
    phone:     str

router = api      # <── export chính thức
__all__ = ["router"]

@router.put("/", summary="Save profile")
def save_profile(body: _Profile, user = Depends(simple_auth)):
    svc.update(user.id, **body.model_dump())
    return {"ok": True}
# --- cuối file ---
