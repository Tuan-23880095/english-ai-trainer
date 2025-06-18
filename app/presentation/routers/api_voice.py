# app/presentation/routers/api_voice.py
from fastapi import APIRouter, UploadFile, File, Request
from app.service.ai_service import WhisperService, ChatService

router = APIRouter(prefix="/api", tags=["api_voice"])

@router.post("/voice")
async def voice_api(request: Request, file: UploadFile = File(None)):
    # Nếu request là JSON (prompt khởi động)
    if request.headers.get("content-type", "").startswith("application/json"):
        data = await request.json()
        prompt = data.get("prompt", "")
        # Lần đầu, chỉ gửi prompt lên ChatGPT
        answer = ChatService.chat(prompt)
        return {"answer": answer}
    # Nếu có file audio: chuyển âm thanh thành text, rồi gửi prompt kiểm tra từ vựng + text đó
    if file is None:
        return {"error": "Thiếu file audio hoặc prompt"}
    audio_bytes = await file.read()
    text = WhisperService.transcribe(audio_bytes)
    # prompt động
    prompt = f"Bạn giúp tôi kiểm tra từ vựng và ngữ pháp: {text}"
    answer = ChatService.chat(prompt)
    return {"user": text, "answer": answer}
