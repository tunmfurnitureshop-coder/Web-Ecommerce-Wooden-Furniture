"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=True, server_default="ADMIN"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "room_categories",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "room_category_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("category_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["room_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("category_id", "locale"),
        sa.UniqueConstraint("locale", "slug"),
    )

    op.create_table(
        "wood_types",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("price_delta_vnd", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "wood_type_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("wood_type_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["wood_type_id"], ["wood_types.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("wood_type_id", "locale"),
    )

    op.create_table(
        "finish_options",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("price_delta_vnd", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "finish_option_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("finish_option_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["finish_option_id"], ["finish_options.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("finish_option_id", "locale"),
    )

    op.create_table(
        "size_options",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("width_cm", sa.Integer(), nullable=True),
        sa.Column("depth_cm", sa.Integer(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("price_delta_vnd", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "size_option_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("size_option_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["size_option_id"], ["size_options.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("size_option_id", "locale"),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("sku", sa.String(), nullable=False),
        sa.Column("room_category_id", sa.String(), nullable=False),
        sa.Column("base_price_vnd", sa.Integer(), nullable=False),
        sa.Column("primary_image_url", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=True, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["room_category_id"], ["room_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
    )

    op.create_table(
        "product_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("specifications", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "locale"),
        sa.UniqueConstraint("locale", "slug"),
    )

    op.create_table(
        "product_wood_types",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("wood_type_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["wood_type_id"], ["wood_types.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "wood_type_id"),
    )

    op.create_table(
        "product_finish_options",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("finish_option_id", sa.String(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["finish_option_id"], ["finish_options.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "finish_option_id"),
    )

    op.create_table(
        "product_size_options",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("size_option_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["size_option_id"], ["size_options.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id", "size_option_id"),
    )

    op.create_table(
        "inventory_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("total_qty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reserved_qty", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_id"),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_code", sa.String(), nullable=False),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_phone", sa.String(), nullable=False),
        sa.Column("customer_email", sa.String(), nullable=True),
        sa.Column("shipping_address", sa.Text(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("subtotal_vnd", sa.Integer(), nullable=False),
        sa.Column("shipping_fee_vnd", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("total_vnd", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(), nullable=True, server_default="VND"),
        sa.Column("order_status", sa.String(), nullable=False),
        sa.Column("payment_status", sa.String(), nullable=False),
        sa.Column("payment_method", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_code"),
    )

    op.create_table(
        "order_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("product_name_snapshot", sa.String(), nullable=False),
        sa.Column("product_sku_snapshot", sa.String(), nullable=False),
        sa.Column("selected_options_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("unit_price_vnd", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total_vnd", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("inventory_items")
    op.drop_table("product_size_options")
    op.drop_table("product_finish_options")
    op.drop_table("product_wood_types")
    op.drop_table("product_translations")
    op.drop_table("products")
    op.drop_table("size_option_translations")
    op.drop_table("size_options")
    op.drop_table("finish_option_translations")
    op.drop_table("finish_options")
    op.drop_table("wood_type_translations")
    op.drop_table("wood_types")
    op.drop_table("room_category_translations")
    op.drop_table("room_categories")
    op.drop_table("admin_users")
