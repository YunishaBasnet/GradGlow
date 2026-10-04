from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    GradGlow application configuration.

    Values can be loaded from environment variables or a local .env file.
    """

    app_name: str = "GradGlow API"
    app_version: str = "1.0.0"
    environment: str = "development"

    database_url: str = "sqlite:///./student_risk.db"

    cors_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    jwt_secret_key: str = Field(
        ..., 
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=60,
        ge=1,
        le=1440,
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        """
        Convert comma-separated origins into a clean list.
        """
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """
    Return one cached settings instance.
    """
    return Settings()


settings = get_settings()
