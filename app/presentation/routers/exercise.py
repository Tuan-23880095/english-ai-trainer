# app/presentation/routers/exercise.py
from fastapi import APIRouter, Depends, Request, UploadFile, Form
from fastapi.responses import HTMLResponse
from app.shared.security import simple_auth


from app.repository.sqlite import SessionLocal, ExerciseRepoSQL, ResultRepoSQL
from app.service.exercise_service import ExerciseService
from app.config.config import get_settings
settings = get_settings()          # luôn lấy cùng một instance
router = APIRouter(prefix="/exercise", tags=["exercise"])

def get_service():
    db = SessionLocal()
    yield ExerciseService(ExerciseRepoSQL(db), ResultRepoSQL(db))
    db.close()

@router.get("/", response_class=HTMLResponse)
def page_ex(request: Request, svc: ExerciseService = Depends(get_service)):
    return request.app.templates.TemplateResponse("exercise.html",
           {"request": request, "ex_list": svc.list_ex()})

@router.post("/{ex_id}/answer")
async def submit_answer(ex_id: int,
                        text: str = Form(...),      # bản đơn giản text
                        user=Depends(simple_auth),
                        svc: ExerciseService = Depends(get_service)):
    result = svc.submit(user.id, ex_id, text)
    return result

