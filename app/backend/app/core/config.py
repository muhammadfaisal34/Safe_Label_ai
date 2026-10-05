from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SafeLabel AI API"
    debug: bool = True
    cors_origins: str = "*"
    database_url: str = "postgresql://safelabel:safelabel@localhost:5432/safelabel"
    jwt_secret: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    max_upload_bytes: int = 10 * 1024 * 1024
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
