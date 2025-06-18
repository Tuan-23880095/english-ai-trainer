# \app\presentation\routers\page.py
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.shared.security import simple_auth  # Thêm dòng này

templates = Jinja2Templates(directory="app/presentation/templates")
router = APIRouter(tags=["page"])

def _render(request: Request, tpl: str, **ctx):
    return templates.TemplateResponse(tpl, {"request": request, **ctx})

@router.get("/signup", response_class=HTMLResponse)
def signup_page(req: Request):
    return _render(req, "signup.html")

@router.get("/profile", response_class=HTMLResponse)
def profile_page(req: Request, user=Depends(simple_auth)):
    return _render(req, "profile.html", user=user)

@router.get("/menu", response_class=HTMLResponse)
def app_page(req: Request, user=Depends(simple_auth)):
   return _render(req, "base.html", user=user)