# app/presentation/routers/profile_api.py
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from datetime import date

from app.shared.security import simple_auth
from app.repository.sqlite import SessionLocal, UserRepoSQL
from app.service.profile_service import ProfileService

router = APIRouter(prefix="/me", tags=["profile"])

# Định nghĩa schema Pydantic để validate dữ liệu gửi lên
class ProfileUpdate(BaseModel):
    full_name: str
    dob:       date = Field(..., description="DD-MM-YYYY")
    hobbies:   str
    phone:     str

@router.put("/", summary="Cập nhật hồ sơ cá nhân")
async def update_profile_endpoint(body: ProfileUpdate, user=Depends(simple_auth)):
    """
    Cập nhật thông tin hồ sơ cá nhân cho user hiện tại
    """
    db = SessionLocal()
    repo = UserRepoSQL(db)
    svc  = ProfileService(repo)
    updated_user = svc.update_profile(user.id, body.model_dump())
    db.close()
    if updated_user:
        return {"success": True, "msg": "Cập nhật thành công"}
    raise HTTPException(status_code=400, detail="Lỗi cập nhật hồ sơ")

# --- cuối file ---
