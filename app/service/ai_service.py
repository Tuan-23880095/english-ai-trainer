#app/service/ai_service.py
from pathlib import Path
from functools import lru_cache
import json
from io import BytesIO

from app.config.config import get_settings
from openai import OpenAI                       # <-- SDK 1.x

settings = get_settings()
client = OpenAI(api_key=settings.openai_key)    # <-- KHỞI TẠO CLIENT

# ---------- Whisper ----------
class WhisperService:
    @staticmethod
    def transcribe(audio_bytes: bytes) -> str:
        """
        Nhận raw bytes (webm/wav/mp3 …) và trả về text.
        """
        resp = client.audio.transcriptions.create(
            model="whisper-1",
            file=("speech.webm", BytesIO(audio_bytes), "audio/webm"),
            response_format="text",
        )
        return resp                               # đã là str vì response_format="text"


# ---------- ChatGPT ----------
class ChatService:
    SYSTEM_PROMPT = "You are a friendly English tutor."

    @staticmethod
    def chat(user_text: str) -> str:
        resp = client.chat.completions.create(     # <-- interface mới
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": ChatService.SYSTEM_PROMPT},
                {"role": "user",   "content": user_text},
            ],
        )
        return resp.choices[0].message.content.strip()

    @staticmethod
    def dictionary(word: str) -> dict:
        definition = ChatService.chat(
            f"Explain the English word \"{word}\" and give one example sentence."
        )
        return {"word": word, "definition": definition}


# ---------- Scoring / Evaluation ----------
class AIService:
    @staticmethod
    def evaluate(answer: str, ground_truth: str) -> tuple[float, str]:
        prompt = (
            f"You are an English teacher. Compare learner answer:\n"
            f"'{answer}'\nwith correct answer:\n'{ground_truth}'. "
            "Return JSON: {score:0-10, feedback:'...'}"
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},      # yêu cầu JSON
        )

        # SDK 1.x trả về JSON dưới dạng text tại `message.content`
        data = json.loads(resp.choices[0].message.content)
        return data["score"], data["feedback"]
