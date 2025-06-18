# app/presentation/routers/api_voice.py

from fastapi import APIRouter, UploadFile, File, Request, Depends
from app.service.ai_service import WhisperService, ChatService
from app.repository.sqlite import SessionLocal, ConversationRepoSQL
from app.shared.security import simple_auth
import uuid

router = APIRouter(prefix="/api", tags=["api_voice"])

@router.post("/voice")
async def voice_api(
    request: Request,
    file: UploadFile = File(None),
    user=Depends(simple_auth)
):
    db = SessionLocal()
    conv_repo = ConversationRepoSQL(db)

    # Nhận session_id từ frontend, nếu chưa có thì sinh mới (chỉ nên sinh ở phiên đầu)
    session_id = request.headers.get("x-session-id")
    if not session_id:
        session_id = str(uuid.uuid4())

    # Nếu là lần đầu (chỉ gửi prompt)
    if request.headers.get("content-type", "").startswith("application/json"):
        data = await request.json()
        prompt = data.get("prompt", "")
        # Lưu message user (nội dung prompt)
        conv_repo.add_message(user_id=user.id, session_id=session_id, role="user", text=prompt)
        answer = ChatService.chat(prompt)
        # Lưu message AI
        conv_repo.add_message(user_id=user.id, session_id=session_id, role="ai", text=answer)
        db.close()
        return {"answer": answer, "session_id": session_id}

    # Các lượt sau: gửi file ghi âm (file audio)
    if file is None:
        db.close()
        return {"error": "Thiếu file audio hoặc prompt", "session_id": session_id}
    audio_bytes = await file.read()
    text = WhisperService.transcribe(audio_bytes)
    # Lưu message user (nội dung vừa nói)
    conv_repo.add_message(user_id=user.id, session_id=session_id, role="user", text=text)
    prompt = f"Bạn giúp tôi kiểm tra từ vựng và ngữ pháp: {text}"
    answer = ChatService.chat(prompt)
    # Lưu message AI (trả lời của AI)
    conv_repo.add_message(user_id=user.id, session_id=session_id, role="ai", text=answer)
    db.close()
    return {"user": text, "answer": answer, "session_id": session_id}
