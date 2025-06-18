# app/presentation/routers/api_voice.py
from fastapi import APIRouter, UploadFile, File

from app.service.ai_service import WhisperService, ChatService
from app.config.config import get_settings

settings = get_settings()        # instance duy nhất cho toàn app
router = APIRouter(prefix="/api", tags=["api_voice"])


@router.post("/voice")
async def voice(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    text   = WhisperService.transcribe(audio_bytes)
    answer = ChatService.chat(text)
    return {"user": text, "answer": answer}


@router.get("/dictionary/{word}")
async def dict_lookup(word: str):
    return ChatService.dictionary(word)
