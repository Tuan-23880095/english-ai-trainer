# app/presentation/routers/exercise.py

from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from app.shared.security import simple_auth
from app.service.ai_service import ChatService
import json

router = APIRouter(prefix="/exercise", tags=["exercise"])

@router.post("/conversation")
async def exercise_conversation(request: Request, user=Depends(simple_auth)):
    """
    API: Giao tiếp hội thoại luyện nói tiếng Anh (Text-to-Text) với ChatGPT.
    - Nhận: lịch sử hội thoại (history), input (câu trả lời mới nhất của user).
    - Trả về:
        - next_question: câu hỏi gợi ý tiếp theo (tiếng Anh)
        - feedback_vi: nhận xét/chỉnh sửa bằng tiếng Việt (về ngữ âm, ngữ pháp, từ vựng)
        - vocab: list từ vựng cần học (hiển thị ở chatbox)
    """
    try:
        data = await request.json()
        history = data.get("history", [])
        user_input = data.get("input", "")

        # 1. Ghép lịch sử hội thoại (system+ai+user...), cộng thêm input mới nhất
        history_msgs = [{"role": x["role"], "content": x["content"]} for x in history]
        history_msgs.append({"role": "user", "content": user_input})

        # 2. Gọi ChatGPT sinh câu hỏi tiếp theo cho user luyện tập (EN)
        prompt_next = (
            "Based on this conversation, ask the learner the next suitable question "
            "to continue practicing English, using no more than two sentences."
        )
        next_question = ChatService.chat_with_history(history_msgs, system_prompt=prompt_next)

        # 3. Gọi ChatGPT để feedback lỗi và gợi ý từ vựng (VI)
        prompt_feedback = (
            f"Bạn là giáo viên tiếng Anh. Đây là câu trả lời của học sinh: \"{user_input}\". "
            "Hãy nhận xét NGẮN GỌN về phát âm/ngữ pháp/từ vựng (bằng tiếng Việt), "
            "và liệt kê tối đa 3 từ vựng nên học (mỗi từ: từ, nghĩa, ví dụ tiếng Anh). "
            "Trả về đúng JSON: {\"feedback_vi\": \"...\", \"vocab\":[{\"word\":\"...\",\"meaning\":\"...\",\"example\":\"...\"}]}"
        )
        feedback_json = ChatService.chat_json(prompt_feedback)

        # Đảm bảo luôn trả về đúng cấu trúc
        return {
            "next_question": next_question,
            "feedback_vi": feedback_json.get("feedback_vi", ""),
            "vocab": feedback_json.get("vocab", []),
        }
    except Exception as e:
        return JSONResponse({"error": f"Lỗi xử lý: {str(e)}"}, status_code=500)
