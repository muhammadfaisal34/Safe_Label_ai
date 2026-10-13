from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SafeLabel AI API"
    debug: bool = True
    cors_origins: str = "*"
    database_url: str = "postgresql://safelabel:safelabel@localhost:5432/safelabel"
    jwt_secret: str = "change-me-in-production-secret-key-32bytes"

    host: str = "0.0.0.0"
    port: int = 8000
    server_ip: str = "127.0.0.1"

    access_token_expire_minutes: int = 60
    max_upload_bytes: int = 10 * 1024 * 1024
    resend_api_key: str = ""
    resend_from_email: str = "SafeLabel AI <onboarding@resend.dev>"
    deepl_api_key: str = ""
    off_base_url: str = "https://world.openfoodfacts.org/api/v2/product"
    off_user_agent: str = "SafeLabelAI/1.0 (https://github.com/safelabel-ai)"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
