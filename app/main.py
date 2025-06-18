# app/main.py
from app.repository.sqlite import migrate
migrate()
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi import Request

from app.shared.exceptions import AppError
from app.presentation.routers import auth, page, profile_api, api_keywords_router     # NEW
from app.config.config import get_settings
settings = get_settings()          # luôn lấy cùng một instance
from app.presentation.routers import (
    auth, exercise, home, api_voice, page, profile_api )
def add_exception_handlers(app):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(status_code=exc.code, content={"detail": exc.message})
def create_app() -> FastAPI:
    app = FastAPI(title="English-AI-Trainer")
    add_exception_handlers(app)
    # === Routers ===
    app.include_router(auth)
    app.include_router(exercise)
    app.include_router(home)
    app.include_router(page)
    app.include_router(profile_api)
    app.include_router(api_voice)   # <-- quan trọng !
    app.include_router(api_keywords_router)

    # === Static files ===
    app.mount(
        "/static",
        StaticFiles(directory="app/presentation/static"),
        name="static",
    )
    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", reload=True)
