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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # Database
    # Default to SQLite for zero-setup local running; easily overridden by POSTGRESQL URL
    DATABASE_URL: str = "sqlite:///./nexus_sdr.db"
    
    # LLM Settings
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = "gemini_friend_dedicated_key.json"
    GCP_PROJECT_ID: str = "kiitfest-backend-01455"
    GCP_LOCATION: str = "global"
    DEFAULT_AI_PROVIDER: str = "vertex"  # Options: 'vertex', 'gemini', 'openai', 'heuristic'
    
    # CORS
    CORS_ORIGINS: List[str] | str = [
        "https://nexus-sdr-frontend.onrender.com",
        "https://nexus-sdr-backend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    def get_cors_origins(self) -> List[str]:
        base_origins = [
            "https://nexus-sdr-frontend.onrender.com",
            "https://nexus-sdr-backend.onrender.com",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
        if isinstance(self.CORS_ORIGINS, str):
            if self.CORS_ORIGINS.strip() == "*":
                return base_origins
            parsed = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
            for b in base_origins:
                if b not in parsed:
                    parsed.append(b)
            return parsed
        
        origins = list(self.CORS_ORIGINS)
        for b in base_origins:
            if b not in origins:
                origins.append(b)
        return origins
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
