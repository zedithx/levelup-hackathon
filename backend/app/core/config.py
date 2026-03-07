from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILES = (PROJECT_ROOT / ".env", PROJECT_ROOT / ".env.local")


class Settings(BaseSettings):
    app_name: str = "LevelUp API"
    app_env: str = "development"
    frontend_origin: str = Field(default="http://localhost:3000", alias="FRONTEND_ORIGIN")
    database_url: str = Field(default="", alias="DATABASE_URL")

    model_config = SettingsConfigDict(
        env_file=ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql://") and "+psycopg" not in self.database_url:
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def frontend_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
