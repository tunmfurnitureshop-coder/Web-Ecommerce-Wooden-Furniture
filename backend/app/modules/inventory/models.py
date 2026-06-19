import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class WoodType(Base):
    __tablename__ = "wood_types"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    price_delta_vnd: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["WoodTypeTranslation"]] = relationship("WoodTypeTranslation", back_populates="wood_type", lazy="selectin")
    product_links: Mapped[List["ProductWoodType"]] = relationship("ProductWoodType", back_populates="wood_type")


class WoodTypeTranslation(Base):
    __tablename__ = "wood_type_translations"
    __table_args__ = (UniqueConstraint("wood_type_id", "locale"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wood_type_id: Mapped[str] = mapped_column(String, ForeignKey("wood_types.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    wood_type: Mapped["WoodType"] = relationship("WoodType", back_populates="translations")


class FinishOption(Base):
    __tablename__ = "finish_options"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    price_delta_vnd: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["FinishOptionTranslation"]] = relationship("FinishOptionTranslation", back_populates="finish_option", lazy="selectin")
    product_links: Mapped[List["ProductFinishOption"]] = relationship("ProductFinishOption", back_populates="finish_option")


class FinishOptionTranslation(Base):
    __tablename__ = "finish_option_translations"
    __table_args__ = (UniqueConstraint("finish_option_id", "locale"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    finish_option_id: Mapped[str] = mapped_column(String, ForeignKey("finish_options.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    finish_option: Mapped["FinishOption"] = relationship("FinishOption", back_populates="translations")


class SizeOption(Base):
    __tablename__ = "size_options"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    width_cm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    depth_cm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    price_delta_vnd: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    translations: Mapped[List["SizeOptionTranslation"]] = relationship("SizeOptionTranslation", back_populates="size_option", lazy="selectin")
    product_links: Mapped[List["ProductSizeOption"]] = relationship("ProductSizeOption", back_populates="size_option")


class SizeOptionTranslation(Base):
    __tablename__ = "size_option_translations"
    __table_args__ = (UniqueConstraint("size_option_id", "locale"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    size_option_id: Mapped[str] = mapped_column(String, ForeignKey("size_options.id"), nullable=False)
    locale: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    size_option: Mapped["SizeOption"] = relationship("SizeOption", back_populates="translations")


class ProductWoodType(Base):
    __tablename__ = "product_wood_types"
    __table_args__ = (UniqueConstraint("product_id", "wood_type_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    wood_type_id: Mapped[str] = mapped_column(String, ForeignKey("wood_types.id"), nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="wood_types")
    wood_type: Mapped["WoodType"] = relationship("WoodType", back_populates="product_links", lazy="selectin")


class ProductFinishOption(Base):
    __tablename__ = "product_finish_options"
    __table_args__ = (UniqueConstraint("product_id", "finish_option_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    finish_option_id: Mapped[str] = mapped_column(String, ForeignKey("finish_options.id"), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="finish_options")
    finish_option: Mapped["FinishOption"] = relationship("FinishOption", back_populates="product_links", lazy="selectin")


class ProductSizeOption(Base):
    __tablename__ = "product_size_options"
    __table_args__ = (UniqueConstraint("product_id", "size_option_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)
    size_option_id: Mapped[str] = mapped_column(String, ForeignKey("size_options.id"), nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="size_options")
    size_option: Mapped["SizeOption"] = relationship("SizeOption", back_populates="product_links", lazy="selectin")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), unique=True, nullable=False)
    total_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reserved_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product: Mapped["Product"] = relationship("Product", back_populates="inventory")

    @property
    def available_qty(self) -> int:
        return self.total_qty - self.reserved_qty
