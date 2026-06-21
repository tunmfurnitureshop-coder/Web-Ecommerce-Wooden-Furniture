import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import CollectionStatus


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default=CollectionStatus.DRAFT)
    cover_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["CollectionTranslation"]] = relationship("CollectionTranslation", back_populates="collection", lazy="selectin")
    product_links: Mapped[List["CollectionProduct"]] = relationship("CollectionProduct", back_populates="collection", order_by="CollectionProduct.sort_order")


class CollectionTranslation(Base):
    __tablename__ = "collection_translations"
    __table_args__ = (
        UniqueConstraint("collection_id", "locale", name="uq_collection_translations_collection_locale"),
        UniqueConstraint("locale", "slug", name="uq_collection_translations_locale_slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    collection_id: Mapped[str] = mapped_column(String, ForeignKey("collections.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_title: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    og_title: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    og_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    collection: Mapped["Collection"] = relationship("Collection", back_populates="translations")


class CollectionProduct(Base):
    __tablename__ = "collection_products"
    __table_args__ = (
        UniqueConstraint("collection_id", "product_id", name="uq_collection_products_collection_product"),
    )

    collection_id: Mapped[str] = mapped_column(String, ForeignKey("collections.id"), nullable=False, primary_key=True)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False, primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    collection: Mapped["Collection"] = relationship("Collection", back_populates="product_links")
