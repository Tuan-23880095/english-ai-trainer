from fastapi import APIRouter, Depends
from app.service.ai_service import ChatService
from app.shared.security import simple_auth
import json

router = APIRouter(prefix="/api", tags=["dictionary"])

@router.get("/dictionary/{word}")
async def lookup_dictionary(word: str, user=Depends(simple_auth)):
    # Prompt cực chi tiết cho ChatGPT để ép định dạng JSON chuẩn (tối ưu với GPT-4o)
    prompt = (
        f"""Bạn là từ điển tiếng Anh. Hãy trả lời đúng chuẩn JSON:
{{
"word": "...",               // từ gốc
"phonetic": "...",           // phiên âm quốc tế
"word_type": "...",          // loại từ (noun, verb, adj, adv, ...)
"meaning": "...",            // nghĩa tiếng Việt đầy đủ
"family_words": [            // tối đa 4 từ cùng họ, mỗi từ có nghĩa và loại từ
    {{"word": "...", "type": "...", "meaning": "..."}},
    ...
],
"example": "...",            // 1 câu ví dụ chứa từ đó
"voice_url": "..."           // link mp3 phát âm (ưu tiên link Cambridge, Oxford, Laban)
}}
Từ cần tra: "{word}"
Chỉ trả về JSON đúng cấu trúc, không giải thích gì thêm."""
    )
    response = ChatService.chat(prompt, response_format={"type": "json_object"})
    try:
        data = json.loads(response)
        # fallback: nếu không có voice_url thì tạo link Laban hoặc Cambridge theo mẫu
        if not data.get("voice_url"):
            data["voice_url"] = f"https://dict.laban.vn/ajax/voice?accent=us&word={word}"
        return data
    except Exception as e:
        return {"word": word, "error": "Không thể lấy dữ liệu từ AI.", "detail": str(e)}

