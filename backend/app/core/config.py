from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Wood Furniture Ecommerce"
    ENV: str = "development"

    DATABASE_URL: str
    # Keep the app's pool well below Supabase's session-mode client cap (15).
    # Total held connections = DB_POOL_SIZE + DB_MAX_OVERFLOW.
    DB_POOL_SIZE: int = 3
    DB_MAX_OVERFLOW: int = 2
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 300

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

    # Redis / Arq worker
    REDIS_URL: str = "redis://localhost:6379/0"
    ARQ_QUEUE_NAME: str = "vin_furniture_jobs"
    ABANDONED_CART_DELAY_MINUTES: int = 120
    ABANDONED_CART_TOKEN_TTL_HOURS: int = 168
    ABANDONED_CART_SCAN_INTERVAL_MINUTES: int = 15

    # Promotion engine
    PROMOTION_TIMEZONE: str = "Asia/Ho_Chi_Minh"
    PROMOTION_MAX_ACTIVE_PER_ORDER: int = 1
    PROMOTION_MAX_COUPON_CODE_LENGTH: int = 40

    @field_validator("ABANDONED_CART_DELAY_MINUTES")
    @classmethod
    def _validate_delay(cls, v: int) -> int:
        if v < 15:
            raise ValueError("ABANDONED_CART_DELAY_MINUTES must be >= 15")
        return v

    @field_validator("ABANDONED_CART_SCAN_INTERVAL_MINUTES")
    @classmethod
    def _validate_scan_interval(cls, v: int) -> int:
        if v < 5:
            raise ValueError("ABANDONED_CART_SCAN_INTERVAL_MINUTES must be >= 5")
        return v

    @field_validator("ABANDONED_CART_TOKEN_TTL_HOURS")
    @classmethod
    def _validate_ttl(cls, v: int) -> int:
        if v < 1:
            raise ValueError("ABANDONED_CART_TOKEN_TTL_HOURS must be >= 1")
        return v

    @field_validator("PROMOTION_MAX_ACTIVE_PER_ORDER")
    @classmethod
    def _validate_max_active(cls, v: int) -> int:
        if v != 1:
            raise ValueError("PROMOTION_MAX_ACTIVE_PER_ORDER must equal 1 in Ver 0.5")
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
