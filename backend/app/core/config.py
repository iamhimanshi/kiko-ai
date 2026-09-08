from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "KIKO AI"
    ENV: str = "development"

    # Database - PostgreSQL
    DATABASE_URL: str = "postgresql://kiko_user:kiko_password@localhost:5432/kiko_db"

    # Auth
    JWT_SECRET: str = "change-me-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI providers
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: str = "groq"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

