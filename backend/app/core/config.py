import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexus AI SDR"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = "super-secret-nexus-key-change-in-production-2026-secure-token"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    # Default to SQLite for zero-setup local running; easily overridden by POSTGRESQL URL
    DATABASE_URL: str = "sqlite:///./nexus_sdr.db"
    
    # LLM Settings
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DEFAULT_AI_PROVIDER: str = "heuristic"  # Options: 'gemini', 'openai', 'heuristic'
    
    # CORS
    CORS_ORIGINS: List[str] | str = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    def get_cors_origins(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
