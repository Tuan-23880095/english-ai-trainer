from fastapi import APIRouter, Request
from app.service.ai_service import ChatService
import json

router = APIRouter(prefix="/api", tags=["keywords"])

@router.post("/keywords")
async def extract_keywords(request: Request):
    data = await request.json()
    text = data.get("conversation", "")
    # Prompt cho ChatGPT: yêu cầu trả về đúng định dạng JSON
    prompt = (
        "Dưới đây là một đoạn hội thoại tiếng Anh:\n"
        f"{text}\n"
        "Hãy liệt kê 3 từ vựng trọng tâm xuất hiện trong đoạn hội thoại này. "
        "Với mỗi từ: 1) ghi rõ từ, 2) nghĩa tiếng Việt, 3) phiên âm quốc tế IPA, 4) cung cấp link phát âm voice (có thể dùng https://dict.laban.vn hoặc https://dictionary.cambridge.org), 5) cho 1 câu ví dụ chứa từ đó. "
        "Trả về dữ liệu theo đúng định dạng JSON: "
        '[{"word":"...","meaning":"...","ipa":"...","voice":"...","example":"..."}, ...]'
    )

    # Nếu ChatService.chat hỗ trợ response_format={"type": "json_object"} thì truyền thêm
    keywords_json = ChatService.chat(prompt, response_format={"type":"json_object"})
    
    try:
        result = json.loads(keywords_json)
    except Exception as e:
        print("Lỗi parse JSON từ OpenAI:", e)
        result = []
    return {"keywords": result}

