from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, JSONResponse
from app.repository.sqlite import SessionLocal, ExerciseRepoSQL, ResultRepoSQL
from app.service.ai_service import AIService
from app.shared.security import simple_auth
from starlette.templating import Jinja2Templates

router = APIRouter(prefix="/exercise", tags=["exercise"])
templates = Jinja2Templates(directory="app/presentation/templates")

@router.get("/", response_class=HTMLResponse)
async def get_exercise(request: Request, user=Depends(simple_auth)):
    db = SessionLocal()
    ex = ExerciseRepoSQL(db).get_first()
    db.close()
    return templates.TemplateResponse("exercise.html", {"request": request, "exercise": ex})

@router.post("/{ex_id}/answer")
async def submit_answer(ex_id: int, request: Request, user=Depends(simple_auth)):
    data = await request.json()
    answer = data.get("answer")
    db = SessionLocal()
    ex = ExerciseRepoSQL(db).get(ex_id)
    if not ex:
        db.close()
        return JSONResponse({"error": "Bài tập không tồn tại!"}, status_code=404)
    score, feedback = AIService.evaluate(answer, ex.answer)

    ResultRepoSQL(db).add(user_id=user.id, exercise_id=ex_id, answer=answer, score=score, feedback=feedback)
    db.close()
    return JSONResponse({"score": score, "feedback": feedback, "model_answer": ex.answer})
