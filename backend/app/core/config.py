from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://monitor:monitor123@db:5432/monitoring"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # API
    API_SECRET_KEY: str = "change-this-secret-key-in-production-minimum-32-chars"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # JWT
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Default admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"

    # Probe tokens
    PROBE_SP_TOKEN: str = "probe-sp-token-change-in-production"
    PROBE_MAO_TOKEN: str = "probe-mao-token-change-in-production"
    PROBE_FRA_TOKEN: str = "probe-fra-token-change-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
