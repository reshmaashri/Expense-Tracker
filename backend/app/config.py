from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "Cloud-Based Expense Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "expense_tracker"
    
    # JWT Authentication
    JWT_SECRET: str = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
    JWT_ALGORITHM: str = "HS256"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    CORS_ORIGINS: str = ""
    
    # Server Port
    PORT: int = 8000

    @property
    def algorithm(self) -> str:
        return self.ALGORITHM or self.JWT_ALGORITHM or "HS256"

    @property
    def cors_origins_list(self) -> List[str]:
        raw = self.CORS_ORIGINS or self.ALLOWED_ORIGINS or "http://localhost:5173,http://127.0.0.1:5173"
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        return origins if origins else ["*"]


settings = Settings()
