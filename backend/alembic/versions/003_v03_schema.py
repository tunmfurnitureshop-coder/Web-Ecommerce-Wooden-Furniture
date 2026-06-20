"""v03 schema — customer auth, wishlist, reviews, enhanced search indexes

Revision ID: 003
Revises: 002
Create Date: 2026-06-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pg_trgm for fuzzy/trigram search
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # customers
    op.create_table(
        "customers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="ACTIVE"),
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_customers_email"),
    )
    op.create_index("idx_customers_email", "customers", ["email"])
    op.create_index("idx_customers_status", "customers", ["status"])
    op.create_index("idx_customers_created_at", "customers", ["created_at"])

    # customer_auth_tokens
    op.create_table(
        "customer_auth_tokens",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("token_type", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_customer_tokens_customer_type", "customer_auth_tokens", ["customer_id", "token_type"])
    op.create_index("idx_customer_tokens_expires_at", "customer_auth_tokens", ["expires_at"])
    op.create_index("idx_customer_tokens_hash", "customer_auth_tokens", ["token_hash"])

    # customer_addresses
    op.create_table(
        "customer_addresses",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("recipient_name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("province_code", sa.String(), nullable=True),
        sa.Column("district_code", sa.String(), nullable=True),
        sa.Column("ward_code", sa.String(), nullable=True),
        sa.Column("full_address", sa.Text(), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_customer_addresses_customer_id", "customer_addresses", ["customer_id"])

    # wishlist_items
    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_id", "product_id", name="uq_wishlist_customer_product"),
    )
    op.create_index("idx_wishlist_customer_id", "wishlist_items", ["customer_id"])

    # product_reviews
    op.create_table(
        "product_reviews",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=False),
        sa.Column("order_item_id", sa.String(), nullable=True),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("title", sa.String(120), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
        sa.Column("is_verified_purchase", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_range"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("customer_id", "product_id", name="uq_review_customer_product"),
    )
    op.create_index("idx_product_reviews_product_id", "product_reviews", ["product_id"])
    op.create_index("idx_product_reviews_customer_id", "product_reviews", ["customer_id"])
    op.create_index("idx_product_reviews_status", "product_reviews", ["status"])

    # Add customer fields to orders
    op.add_column("orders", sa.Column("customer_id", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("guest_email", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("guest_order_claim_token_hash", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("guest_order_claimed_at", sa.DateTime(), nullable=True))
    op.create_foreign_key("fk_orders_customer_id", "orders", "customers", ["customer_id"], ["id"])
    op.create_index("idx_orders_customer_id", "orders", ["customer_id"])
    op.create_index("idx_orders_guest_email", "orders", ["guest_email"])

    # GIN indexes for pg_trgm search on product translations
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_product_translations_name_trgm "
        "ON product_translations USING gin(name gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_product_translations_short_desc_trgm "
        "ON product_translations USING gin(short_description gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_product_translations_short_desc_trgm")
    op.execute("DROP INDEX IF EXISTS idx_product_translations_name_trgm")

    op.drop_index("idx_orders_guest_email", "orders")
    op.drop_index("idx_orders_customer_id", "orders")
    op.drop_constraint("fk_orders_customer_id", "orders", type_="foreignkey")
    op.drop_column("orders", "guest_order_claimed_at")
    op.drop_column("orders", "guest_order_claim_token_hash")
    op.drop_column("orders", "guest_email")
    op.drop_column("orders", "customer_id")

    op.drop_index("idx_product_reviews_status", "product_reviews")
    op.drop_index("idx_product_reviews_customer_id", "product_reviews")
    op.drop_index("idx_product_reviews_product_id", "product_reviews")
    op.drop_table("product_reviews")

    op.drop_index("idx_wishlist_customer_id", "wishlist_items")
    op.drop_table("wishlist_items")

    op.drop_index("idx_customer_addresses_customer_id", "customer_addresses")
    op.drop_table("customer_addresses")

    op.drop_index("idx_customer_tokens_hash", "customer_auth_tokens")
    op.drop_index("idx_customer_tokens_expires_at", "customer_auth_tokens")
    op.drop_index("idx_customer_tokens_customer_type", "customer_auth_tokens")
    op.drop_table("customer_auth_tokens")

    op.drop_index("idx_customers_created_at", "customers")
    op.drop_index("idx_customers_status", "customers")
    op.drop_index("idx_customers_email", "customers")
    op.drop_table("customers")
