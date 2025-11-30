"""Application configuration"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    DIRECT_URL: str  # For Prisma migrations
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # LLM
    OPENROUTER_API_KEY: str
    DEFAULT_LLM_MODEL: str = "google/gemini-flash-2.0"
    FALLBACK_LLM_MODEL: str = "openai/gpt-4o-mini"
    
    # Embeddings (for future RAG if needed)
    EMBEDDING_MODEL: str = "google/gemini-embedding-001"
    EMBEDDING_DIMENSIONS: int = 3072
    
    # Retrieval settings
    TOP_K_RETRIEVAL: int = 200
    USE_CATEGORY_FILTER: bool = True
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000


# Global settings instance
settings = Settings()
