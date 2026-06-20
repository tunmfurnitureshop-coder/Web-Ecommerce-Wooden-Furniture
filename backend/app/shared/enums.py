import enum


class Locale(str, enum.Enum):
    VI = "vi"
    ZH_CN = "zh-CN"


class ProductStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    SHIPPING = "SHIPPING"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, enum.Enum):
    COD = "COD"
    BANK_TRANSFER = "BANK_TRANSFER"
    PAYOS = "PAYOS"
    MOCK_PROVIDER = "MOCK_PROVIDER"


class PaymentProvider(str, enum.Enum):
    PAYOS = "PAYOS"
    MANUAL_BANK_TRANSFER = "MANUAL_BANK_TRANSFER"
    COD = "COD"
    MOCK_PROVIDER = "MOCK_PROVIDER"


class PaymentTransactionStatus(str, enum.Enum):
    CREATED = "CREATED"
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class WebhookProvider(str, enum.Enum):
    PAYOS = "PAYOS"


class WebhookProcessingStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"
    IGNORED = "IGNORED"


class EmailProvider(str, enum.Enum):
    RESEND = "RESEND"
    CONSOLE = "CONSOLE"


class EmailStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class OrderEventActorType(str, enum.Enum):
    SYSTEM = "SYSTEM"
    ADMIN = "ADMIN"
    WEBHOOK = "WEBHOOK"
