# app\presentation\routers\home.py
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.shared.security import simple_auth      # <── kiểm tra header xác thực
from app.repository.memory import UserRepoMem

templates = Jinja2Templates(directory="app/presentation/templates")
router    = APIRouter(tags=["home"])
repo = UserRepoMem()

# ─────────── Trang landing (không cần đăng nhập) ───────────
@router.get("/", response_class=HTMLResponse)
def landing(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# ─────────── Trang menu (cần đăng nhập) ───────────
@router.get("/menu", response_class=HTMLResponse)
def menu_page(request: Request, user=Depends(simple_auth)):
    return templates.TemplateResponse("base.html", {"request": request, "user": user})

# ─────────── Các trang chỉ cho user đã đăng nhập ───────────
@router.get("/dictionary", response_class=HTMLResponse)
def dictionary_page(request: Request, user=Depends(simple_auth)):
    return templates.TemplateResponse("dictionary.html", {"request": request, "user": user})

@router.get("/voice", response_class=HTMLResponse)
def voice_page(request: Request, user=Depends(simple_auth)):
    return templates.TemplateResponse("voice.html", {"request": request, "user": user})

@router.get("/exercise", response_class=HTMLResponse)
def exercise_page(request: Request, user=Depends(simple_auth)):
    return templates.TemplateResponse("exercise.html", {"request": request, "user": user})
