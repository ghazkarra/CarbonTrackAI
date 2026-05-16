from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "sqlite:///./carboncore_dev.db"
    jwt_secret_key: str = "change-me-in-development"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    chroma_db_path: str = "./chroma_db"
    chroma_collection_name: str = "emission_knowledge_base"
    llm_base_url: str = "https://integrate.api.nvidia.com/v1"
    llm_api_key: str | None = None
    llm_model: str = "deepseek-ai/deepseek-v4-pro"
    default_electricity_ef_kgco2e_per_kwh: float = 0.85
    pdf_output_dir: str = "./storage/reports"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
