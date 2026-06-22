import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import (
    PromotionStatus, PromotionTrigger, PromotionScopeType,
    DiscountType, PromotionRedemptionStatus,
)


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)

    code: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    code_normalized: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, unique=True)

    trigger: Mapped[str] = mapped_column(String, nullable=False)
    scope_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default=PromotionStatus.DRAFT)

    discount_type: Mapped[str] = mapped_column(String, nullable=False)
    discount_percentage_bps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    discount_amount_vnd: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_discount_vnd: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    min_order_value_vnd: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    usage_limit_total: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    usage_limit_per_customer: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    translations: Mapped[List["PromotionTranslation"]] = relationship(
        "PromotionTranslation", back_populates="promotion", lazy="selectin"
    )
    product_targets: Mapped[List["PromotionProductTarget"]] = relationship(
        "PromotionProductTarget", back_populates="promotion", lazy="selectin"
    )
    category_targets: Mapped[List["PromotionCategoryTarget"]] = relationship(
        "PromotionCategoryTarget", back_populates="promotion", lazy="selectin"
    )
    collection_targets: Mapped[List["PromotionCollectionTarget"]] = relationship(
        "PromotionCollectionTarget", back_populates="promotion", lazy="selectin"
    )
    payment_method_targets: Mapped[List["PromotionPaymentMethodTarget"]] = relationship(
        "PromotionPaymentMethodTarget", back_populates="promotion", lazy="selectin"
    )
    bundle_requirements: Mapped[List["PromotionBundleRequirement"]] = relationship(
        "PromotionBundleRequirement", back_populates="promotion", lazy="selectin"
    )
    redemptions: Mapped[List["PromotionRedemption"]] = relationship(
        "PromotionRedemption", back_populates="promotion", lazy="dynamic"
    )


class PromotionTranslation(Base):
    __tablename__ = "promotion_translations"
    __table_args__ = (UniqueConstraint("promotion_id", "locale", name="uq_promo_translation_locale"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)
    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    badge_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="translations")


class PromotionProductTarget(Base):
    __tablename__ = "promotion_product_targets"
    __table_args__ = (UniqueConstraint("promotion_id", "product_id", name="uq_promo_product_target"),)

    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), primary_key=True)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="product_targets")


class PromotionCategoryTarget(Base):
    __tablename__ = "promotion_category_targets"
    __table_args__ = (UniqueConstraint("promotion_id", "room_category_id", name="uq_promo_category_target"),)

    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), primary_key=True)
    room_category_id: Mapped[str] = mapped_column(String, ForeignKey("room_categories.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="category_targets")


class PromotionCollectionTarget(Base):
    __tablename__ = "promotion_collection_targets"
    __table_args__ = (UniqueConstraint("promotion_id", "collection_id", name="uq_promo_collection_target"),)

    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), primary_key=True)
    collection_id: Mapped[str] = mapped_column(String, ForeignKey("collections.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="collection_targets")


class PromotionPaymentMethodTarget(Base):
    __tablename__ = "promotion_payment_method_targets"
    __table_args__ = (UniqueConstraint("promotion_id", "payment_method", name="uq_promo_payment_method_target"),)

    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), primary_key=True)
    payment_method: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="payment_method_targets")


class PromotionBundleRequirement(Base):
    __tablename__ = "promotion_bundle_requirements"
    __table_args__ = (UniqueConstraint("promotion_id", "product_id", name="uq_promo_bundle_req_product"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)
    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    minimum_quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="bundle_requirements")


class PromotionRedemption(Base):
    __tablename__ = "promotion_redemptions"
    __table_args__ = (UniqueConstraint("promotion_id", "order_id", name="uq_promo_redemption_order"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)

    promotion_id: Mapped[str] = mapped_column(String, ForeignKey("promotions.id"), nullable=False)
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)

    customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id"), nullable=True)
    guest_email_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default=PromotionRedemptionStatus.RESERVED)

    discount_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, nullable=False, default="VND")

    reserved_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    redeemed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    promotion: Mapped["Promotion"] = relationship("Promotion", back_populates="redemptions")


class OrderPromotion(Base):
    __tablename__ = "order_promotions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)

    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False, unique=True)
    promotion_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("promotions.id"), nullable=True)

    promotion_code_snapshot: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    promotion_name_snapshot: Mapped[str] = mapped_column(String, nullable=False)

    trigger_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    scope_type_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    discount_type_snapshot: Mapped[str] = mapped_column(String, nullable=False)

    discount_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    allocation_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
