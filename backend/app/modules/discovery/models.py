import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import ProductRelationType


class ProductRelation(Base):
    __tablename__ = "product_relations"
    __table_args__ = (
        UniqueConstraint("source_product_id", "target_product_id", "relation_type", name="uq_product_relations_source_target_type"),
        CheckConstraint("source_product_id != target_product_id", name="ck_product_relations_no_self"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    source_product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    target_product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    relation_type: Mapped[str] = mapped_column(String, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class SearchSynonym(Base):
    __tablename__ = "search_synonyms"
    __table_args__ = (
        UniqueConstraint("locale", "synonym_term", name="uq_search_synonyms_locale_synonym"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    locale: Mapped[str] = mapped_column(String, nullable=False)
    canonical_term: Mapped[str] = mapped_column(String, nullable=False)
    synonym_term: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
