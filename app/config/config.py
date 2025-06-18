# app/config/config.py
from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# nạp file .env càng sớm càng tốt
load_dotenv(BASE_DIR / ".env")
class Settings(BaseSettings):
    # ----- các biến bạn có trong .env -----
    db_url:         str  = Field("sqlite:///./trainer.db", env="DB_URL")
    openai_key: str  = Field(...,                     env="OPENAI_KEY")
    jwt_secret:     str  = Field("change-me",             env="JWT_SECRET")
    jwt_expire_min: int  = Field(60,                      env="JWT_EXPIRE_MIN")

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",          # <-- trỏ thẳng tới .env
        env_file_encoding="utf-8",
    )
@lru_cache
def get_settings() -> Settings:
    return Settings()
settings = get_settings()
