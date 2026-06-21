import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import TagType


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["TagTranslation"]] = relationship("TagTranslation", back_populates="tag", lazy="selectin")
    product_links: Mapped[List["ProductTag"]] = relationship("ProductTag", back_populates="tag")


class TagTranslation(Base):
    __tablename__ = "tag_translations"
    __table_args__ = (
        UniqueConstraint("tag_id", "locale", name="uq_tag_translations_tag_locale"),
        UniqueConstraint("locale", "slug", name="uq_tag_translations_locale_slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tag_id: Mapped[str] = mapped_column(String, ForeignKey("tags.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    tag: Mapped["Tag"] = relationship("Tag", back_populates="translations")


class ProductTag(Base):
    __tablename__ = "product_tags"
    __table_args__ = (
        UniqueConstraint("product_id", "tag_id", name="uq_product_tags_product_tag"),
    )

    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False, primary_key=True)
    tag_id: Mapped[str] = mapped_column(String, ForeignKey("tags.id"), nullable=False, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    tag: Mapped["Tag"] = relationship("Tag", back_populates="product_links", lazy="selectin")
