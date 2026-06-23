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


class CustomerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"


class CustomerTokenType(str, enum.Enum):
    REFRESH = "REFRESH"
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"


class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HIDDEN = "HIDDEN"


class TagType(str, enum.Enum):
    STYLE = "STYLE"
    MATERIAL = "MATERIAL"
    ROOM = "ROOM"
    USAGE = "USAGE"
    CAPACITY = "CAPACITY"
    PRICE_TIER = "PRICE_TIER"
    FEATURE = "FEATURE"
    AVAILABILITY = "AVAILABILITY"


class CollectionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ContentType(str, enum.Enum):
    BUYING_GUIDE = "BUYING_GUIDE"
    MATERIAL_GUIDE = "MATERIAL_GUIDE"
    CARE_GUIDE = "CARE_GUIDE"
    ROOM_INSPIRATION = "ROOM_INSPIRATION"
    NEWS = "NEWS"


class ContentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ProductRelationType(str, enum.Enum):
    MANUAL_RELATED = "MANUAL_RELATED"
    CROSS_SELL = "CROSS_SELL"
    UPSELL = "UPSELL"


class PromotionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ARCHIVED = "ARCHIVED"


class PromotionTrigger(str, enum.Enum):
    COUPON = "COUPON"
    AUTOMATIC = "AUTOMATIC"


class PromotionScopeType(str, enum.Enum):
    CART = "CART"
    PRODUCT = "PRODUCT"
    CATEGORY = "CATEGORY"
    COLLECTION = "COLLECTION"
    BUNDLE = "BUNDLE"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"


class PromotionRedemptionStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    REDEEMED = "REDEEMED"
    RELEASED = "RELEASED"


class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ARCHIVED = "ARCHIVED"


class CampaignPlacement(str, enum.Enum):
    HOME_HERO = "HOME_HERO"
    HOME_SECTION = "HOME_SECTION"
    COLLECTION_SECTION = "COLLECTION_SECTION"
    PRODUCT_PAGE = "PRODUCT_PAGE"
    CART = "CART"
    CHECKOUT = "CHECKOUT"


class CommerceEventName(str, enum.Enum):
    PRODUCT_VIEWED = "PRODUCT_VIEWED"
    SEARCH_PERFORMED = "SEARCH_PERFORMED"
    SEARCH_RESULT_CLICKED = "SEARCH_RESULT_CLICKED"
    PRODUCT_ADDED_TO_CART = "PRODUCT_ADDED_TO_CART"
    PRODUCT_REMOVED_FROM_CART = "PRODUCT_REMOVED_FROM_CART"
    CART_VIEWED = "CART_VIEWED"
    CHECKOUT_STARTED = "CHECKOUT_STARTED"
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED"
    PURCHASE_COMPLETED = "PURCHASE_COMPLETED"
    PROMOTION_APPLIED = "PROMOTION_APPLIED"
    PROMOTION_REJECTED = "PROMOTION_REJECTED"
    WISHLIST_ADDED = "WISHLIST_ADDED"
    WISHLIST_REMOVED = "WISHLIST_REMOVED"


class CommerceEventSource(str, enum.Enum):
    CLIENT = "CLIENT"
    SERVER = "SERVER"


class CartRecoveryStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CHECKOUT_STARTED = "CHECKOUT_STARTED"
    ABANDONED = "ABANDONED"
    PURCHASED = "PURCHASED"
    EXPIRED = "EXPIRED"
