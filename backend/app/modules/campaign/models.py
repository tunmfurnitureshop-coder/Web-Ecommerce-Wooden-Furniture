import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Campaign(Base):
    __tablename__ = "campaigns"
    __table_args__ = (UniqueConstraint("code", name="uq_campaigns_code"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)
    code: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="DRAFT")
    hero_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mobile_hero_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    placement: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    display_priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    translations: Mapped[List["CampaignTranslation"]] = relationship(
        "CampaignTranslation", back_populates="campaign", lazy="selectin"
    )


class CampaignTranslation(Base):
    __tablename__ = "campaign_translations"
    __table_args__ = (
        UniqueConstraint("campaign_id", "locale", name="uq_campaign_translation_locale"),
        UniqueConstraint("locale", "slug", name="uq_campaign_translation_locale_slug"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uid)
    campaign_id: Mapped[str] = mapped_column(String, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="translations")
