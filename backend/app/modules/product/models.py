import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import ProductStatus


class RoomCategory(Base):
    __tablename__ = "room_categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["RoomCategoryTranslation"]] = relationship("RoomCategoryTranslation", back_populates="category", lazy="selectin")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="room_category")


class RoomCategoryTranslation(Base):
    __tablename__ = "room_category_translations"
    __table_args__ = (
        UniqueConstraint("category_id", "locale"),
        UniqueConstraint("locale", "slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[str] = mapped_column(String, ForeignKey("room_categories.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    category: Mapped["RoomCategory"] = relationship("RoomCategory", back_populates="translations")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    room_category_id: Mapped[str] = mapped_column(String, ForeignKey("room_categories.id"), nullable=False)
    base_price_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    primary_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default=ProductStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    room_category: Mapped["RoomCategory"] = relationship("RoomCategory", back_populates="products")
    translations: Mapped[List["ProductTranslation"]] = relationship("ProductTranslation", back_populates="product", lazy="selectin")
    inventory: Mapped[Optional["InventoryItem"]] = relationship("InventoryItem", back_populates="product", uselist=False, lazy="selectin")
    wood_types: Mapped[List["ProductWoodType"]] = relationship("ProductWoodType", back_populates="product", lazy="selectin")
    finish_options: Mapped[List["ProductFinishOption"]] = relationship("ProductFinishOption", back_populates="product", lazy="selectin")
    size_options: Mapped[List["ProductSizeOption"]] = relationship("ProductSizeOption", back_populates="product", lazy="selectin")


class ProductTranslation(Base):
    __tablename__ = "product_translations"
    __table_args__ = (
        UniqueConstraint("product_id", "locale"),
        UniqueConstraint("locale", "slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specifications: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product: Mapped["Product"] = relationship("Product", back_populates="translations")
