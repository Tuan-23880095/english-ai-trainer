# app/service/exercise_service.py
from app.repository.abc import IExerciseRepo, IResultRepo
from app.service.ai_service import AIService
from app.domain.models import Result
from app.config.config import get_settings
settings = get_settings()          # luôn lấy cùng một instance
class ExerciseService:
    def __init__(self, ex_repo: IExerciseRepo, res_repo: IResultRepo):
        self.ex_repo, self.res_repo = ex_repo, res_repo

    def list_ex(self): return self.ex_repo.list_all()

    def submit(self, user_id: int, ex_id: int, learner_ans: str) -> Result:
        ex = self.ex_repo.get(ex_id) or (_ for _ in ()).throw(ValueError("404"))
        score, feedback = AIService.evaluate(learner_ans, ex.answer)
        return self.res_repo.add(Result(user_id=user_id, exercise_id=ex_id,
                                        score=score, feedback=feedback))

