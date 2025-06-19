# app/service/ai_service.py

from pathlib import Path
from functools import lru_cache
import json
from io import BytesIO

from app.config.config import get_settings
from openai import OpenAI  # SDK OpenAI 1.x

settings = get_settings()
client = OpenAI(api_key=settings.openai_key)

# ---------- Whisper: Speech to Text ----------
class WhisperService:
    @staticmethod
    def transcribe(audio_bytes: bytes) -> str:
        """
        Nhận raw bytes (webm/wav/mp3…) và trả về text (dùng Whisper API).
        """
        resp = client.audio.transcriptions.create(
            model="whisper-1",
            file=("speech.webm", BytesIO(audio_bytes), "audio/webm"),
            response_format="text",
        )
        return resp  # resp đã là str khi dùng response_format="text"


# ---------- ChatGPT đa nhiệm ----------
class ChatService:
    SYSTEM_PROMPT = (
        "You are a friendly English tutor and you start the conversation. "
        "Please always answer concisely and shortly, no more than 2 sentences."
    )

    @staticmethod
    def chat(user_text: str, response_format=None, model="gpt-4o") -> str:
        """
        Chat 1 lượt, giữ nguyên response_format cho các route cần JSON.
        """
        params = dict(
            model=model,
            messages=[
                {"role": "system", "content": ChatService.SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
        )
        if response_format:
            params["response_format"] = response_format
        resp = client.chat.completions.create(**params)
        return resp.choices[0].message.content.strip()

    @staticmethod
    def chat_with_history(history_msgs, system_prompt=None, model="gpt-4o") -> str:
        """
        Chat nhiều lượt với lịch sử hội thoại, dùng để sinh câu hỏi tiếp theo trong exercise hội thoại.
        """
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(history_msgs)
        resp = client.chat.completions.create(
            model=model,
            messages=msgs,
        )
        return resp.choices[0].message.content.strip()

    @staticmethod
    def chat_json(user_prompt: str, model="gpt-4o") -> dict:
        """
        Gửi prompt và ép ChatGPT trả về JSON chuẩn (dùng cho feedback exercise).
        """
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là giáo viên tiếng Anh, luôn trả về đúng JSON."},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content.strip())

    @staticmethod
    def dictionary(word: str, model="gpt-4o") -> dict:
        """
        Tra từ điển nâng cao: trả về nghĩa, ví dụ, loại từ, phiên âm...
        (Dùng cho route dictionary.)
        """
        prompt = (
            f"""Bạn là từ điển tiếng Anh. Hãy trả lời đúng chuẩn JSON:
{{
"word": "...",
"phonetic": "...",
"word_type": "...",
"meaning": "...",
"family_words": [{{"word": "...", "type": "...", "meaning": "..."}}],
"example": "...",
"voice_url": "..."
}}
Từ cần tra: "{word}"
Chỉ trả về JSON đúng cấu trúc, không giải thích gì thêm."""
        )
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content.strip())

    @staticmethod
    def WRITE(user_text: str, response_format=None, model="gpt-4o-mini") -> str:
        """
        Hàm đặc biệt giữ lại cho các luồng trước dùng gpt-4o-mini trả về JSON.
        """
        params = dict(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là trợ lý học tiếng Anh, luôn trả lời đúng định dạng JSON."},
                {"role": "user", "content": user_text}
            ]
        )
        if response_format:
            params["response_format"] = response_format
        resp = client.chat.completions.create(**params)
        return resp.choices[0].message.content.strip()


# ---------- Đánh giá exercise kiểu so đáp án mẫu ----------
class AIService:
    @staticmethod
    def evaluate(answer: str, ground_truth: str) -> tuple[float, str]:
        """
        Đánh giá đáp án học viên so với đáp án mẫu, trả về điểm số và nhận xét (cho chức năng exercise truyền thống).
        """
        prompt = (
            f"You are an English teacher. Compare learner answer:\n"
            f"'{answer}'\nwith correct answer:\n'{ground_truth}'. "
            "Return JSON: {score:0-10, feedback:'...'}"
        )
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        return data["score"], data["feedback"]

