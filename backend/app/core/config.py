from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Wood Furniture Ecommerce"
    ENV: str = "development"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    CUSTOMER_JWT_EXPIRE_MINUTES: int = 15
    CUSTOMER_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_TOKEN_COOKIE_NAME: str = "refresh_token"

    FRONTEND_BASE_URL: str = "http://localhost:3000"
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_HOURS: int = 1

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    SITE_BASE_URL: str = "https://vinfurniture.vn"
    CORS_ORIGINS: str = "http://localhost:3000"

    # payOS
    PAYOS_CLIENT_ID: str = ""
    PAYOS_API_KEY: str = ""
    PAYOS_CHECKSUM_KEY: str = ""
    PAYOS_RETURN_URL: str = "http://localhost:3000/vi/checkout/return"
    PAYOS_CANCEL_URL: str = "http://localhost:3000/vi/checkout/cancel"
    PAYOS_WEBHOOK_URL: str = "http://localhost:8000/api/v1/webhooks/payos"

    # R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT_URL: str = ""
    R2_PUBLIC_BASE_URL: str = ""

    # Email
    EMAIL_PROVIDER: str = "console"
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Wood Furniture <no-reply@example.com>"
    ADMIN_NOTIFICATION_EMAIL: str = "admin@example.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
