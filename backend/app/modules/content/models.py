import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import ContentType, ContentStatus


class ContentPost(Base):
    __tablename__ = "content_posts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default=ContentStatus.DRAFT)
    cover_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    author_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["ContentPostTranslation"]] = relationship("ContentPostTranslation", back_populates="post", lazy="selectin")
    product_links: Mapped[List["ContentPostProduct"]] = relationship("ContentPostProduct", back_populates="post", order_by="ContentPostProduct.sort_order")
    category_links: Mapped[List["ContentPostCategory"]] = relationship("ContentPostCategory", back_populates="post")


class ContentPostTranslation(Base):
    __tablename__ = "content_post_translations"
    __table_args__ = (
        UniqueConstraint("content_post_id", "locale", name="uq_content_post_translations_post_locale"),
        UniqueConstraint("locale", "slug", name="uq_content_post_translations_locale_slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content_post_id: Mapped[str] = mapped_column(String, ForeignKey("content_posts.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    excerpt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    meta_title: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    og_title: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)
    og_description: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    post: Mapped["ContentPost"] = relationship("ContentPost", back_populates="translations")


class ContentPostProduct(Base):
    __tablename__ = "content_post_products"
    __table_args__ = (
        UniqueConstraint("content_post_id", "product_id", name="uq_content_post_products_post_product"),
    )

    content_post_id: Mapped[str] = mapped_column(String, ForeignKey("content_posts.id"), nullable=False, primary_key=True)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False, primary_key=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    post: Mapped["ContentPost"] = relationship("ContentPost", back_populates="product_links")


class ContentPostCategory(Base):
    __tablename__ = "content_post_categories"
    __table_args__ = (
        UniqueConstraint("content_post_id", "room_category_id", name="uq_content_post_categories_post_category"),
    )

    content_post_id: Mapped[str] = mapped_column(String, ForeignKey("content_posts.id"), nullable=False, primary_key=True)
    room_category_id: Mapped[str] = mapped_column(String, ForeignKey("room_categories.id"), nullable=False, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    post: Mapped["ContentPost"] = relationship("ContentPost", back_populates="category_links")
