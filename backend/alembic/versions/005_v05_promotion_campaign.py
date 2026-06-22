"""v05 promotion, campaign, analytics, cart recovery

Revision ID: 005
Revises: 004
Create Date: 2026-06-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ----------------------------------------------------------- promotions
    op.create_table(
        "promotions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(40), nullable=True),
        sa.Column("code_normalized", sa.String(40), nullable=True),
        sa.Column("trigger", sa.String(), nullable=False),
        sa.Column("scope_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
        sa.Column("discount_type", sa.String(), nullable=False),
        sa.Column("discount_percentage_bps", sa.Integer(), nullable=True),
        sa.Column("discount_amount_vnd", sa.Integer(), nullable=True),
        sa.Column("max_discount_vnd", sa.Integer(), nullable=True),
        sa.Column("min_order_value_vnd", sa.Integer(), nullable=True),
        sa.Column("usage_limit_total", sa.Integer(), nullable=True),
        sa.Column("usage_limit_per_customer", sa.Integer(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_normalized", name="uq_promotions_code_normalized"),
    )
    op.create_index("idx_promotions_status", "promotions", ["status"])
    op.create_index("idx_promotions_trigger", "promotions", ["trigger"])
    op.create_index("idx_promotions_starts_at", "promotions", ["starts_at"])
    op.create_index("idx_promotions_ends_at", "promotions", ["ends_at"])

    # ------------------------------------------------ promotion_translations
    op.create_table(
        "promotion_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("badge_label", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("promotion_id", "locale", name="uq_promo_translation_locale"),
    )
    op.create_index("idx_promo_translations_promotion_id", "promotion_translations", ["promotion_id"])

    # --------------------------------------------- promotion_product_targets
    op.create_table(
        "promotion_product_targets",
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("promotion_id", "product_id"),
        sa.UniqueConstraint("promotion_id", "product_id", name="uq_promo_product_target"),
    )

    # ------------------------------------------- promotion_category_targets
    op.create_table(
        "promotion_category_targets",
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("room_category_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["room_category_id"], ["room_categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("promotion_id", "room_category_id"),
        sa.UniqueConstraint("promotion_id", "room_category_id", name="uq_promo_category_target"),
    )

    # ----------------------------------------- promotion_collection_targets
    op.create_table(
        "promotion_collection_targets",
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("collection_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("promotion_id", "collection_id"),
        sa.UniqueConstraint("promotion_id", "collection_id", name="uq_promo_collection_target"),
    )

    # -------------------------------------- promotion_payment_method_targets
    op.create_table(
        "promotion_payment_method_targets",
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("payment_method", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("promotion_id", "payment_method"),
        sa.UniqueConstraint("promotion_id", "payment_method", name="uq_promo_payment_method_target"),
    )

    # ---------------------------------------- promotion_bundle_requirements
    op.create_table(
        "promotion_bundle_requirements",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("minimum_quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("promotion_id", "product_id", name="uq_promo_bundle_req_product"),
    )
    op.create_index("idx_promo_bundle_req_promotion_id", "promotion_bundle_requirements", ["promotion_id"])

    # ---------------------------------------------------------------- campaigns
    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
        sa.Column("hero_image_url", sa.Text(), nullable=True),
        sa.Column("mobile_hero_image_url", sa.Text(), nullable=True),
        sa.Column("placement", sa.String(), nullable=True),
        sa.Column("display_priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_campaigns_code"),
    )
    op.create_index("idx_campaigns_status", "campaigns", ["status"])
    op.create_index("idx_campaigns_placement", "campaigns", ["placement"])
    op.create_index("idx_campaigns_starts_at", "campaigns", ["starts_at"])

    # -------------------------------------------------- campaign_translations
    op.create_table(
        "campaign_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("campaign_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("description_markdown", sa.Text(), nullable=True),
        sa.Column("meta_title", sa.String(180), nullable=True),
        sa.Column("meta_description", sa.String(320), nullable=True),
        sa.Column("og_title", sa.String(180), nullable=True),
        sa.Column("og_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "locale", name="uq_campaign_translation_locale"),
        sa.UniqueConstraint("locale", "slug", name="uq_campaign_translation_locale_slug"),
    )
    op.create_index("idx_campaign_translations_campaign_id", "campaign_translations", ["campaign_id"])

    # -------------------------------------------------- campaign_promotions
    op.create_table(
        "campaign_promotions",
        sa.Column("campaign_id", sa.String(), nullable=False),
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("campaign_id", "promotion_id"),
        sa.UniqueConstraint("campaign_id", "promotion_id", name="uq_campaign_promotions"),
    )

    # ---------------------------------------------------- campaign_products
    op.create_table(
        "campaign_products",
        sa.Column("campaign_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("campaign_id", "product_id"),
        sa.UniqueConstraint("campaign_id", "product_id", name="uq_campaign_products"),
    )

    # ------------------------------------------------- campaign_collections
    op.create_table(
        "campaign_collections",
        sa.Column("campaign_id", sa.String(), nullable=False),
        sa.Column("collection_id", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("campaign_id", "collection_id"),
        sa.UniqueConstraint("campaign_id", "collection_id", name="uq_campaign_collections"),
    )

    # ---------------------------------------------------- commerce_events
    op.create_table(
        "commerce_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("event_name", sa.String(), nullable=False),
        sa.Column("event_source", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=True),
        sa.Column("anonymous_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("product_id", sa.String(), nullable=True),
        sa.Column("order_id", sa.String(), nullable=True),
        sa.Column("promotion_id", sa.String(), nullable=True),
        sa.Column("campaign_id", sa.String(), nullable=True),
        sa.Column("locale", sa.String(), nullable=True),
        sa.Column("source_page", sa.String(500), nullable=True),
        sa.Column("referrer", sa.String(500), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_commerce_events_name_occurred", "commerce_events", ["event_name", "occurred_at"])
    op.create_index("idx_commerce_events_customer_occurred", "commerce_events", ["customer_id", "occurred_at"])
    op.create_index("idx_commerce_events_anon_occurred", "commerce_events", ["anonymous_id", "occurred_at"])
    op.create_index("idx_commerce_events_session_occurred", "commerce_events", ["session_id", "occurred_at"])
    op.create_index("idx_commerce_events_product_occurred", "commerce_events", ["product_id", "occurred_at"])
    op.create_index("idx_commerce_events_order_occurred", "commerce_events", ["order_id", "occurred_at"])
    op.create_index("idx_commerce_events_campaign_occurred", "commerce_events", ["campaign_id", "occurred_at"])

    # ------------------------------------------------ cart_recovery_sessions
    op.create_table(
        "cart_recovery_sessions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=True),
        sa.Column("anonymous_id", sa.String(), nullable=True),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("email_hash", sa.String(), nullable=True),
        sa.Column("marketing_opt_in", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("locale", sa.String(), nullable=False, server_default="vi"),
        sa.Column("cart_snapshot", sa.JSON(), nullable=False),
        sa.Column("cart_value_vnd", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="ACTIVE"),
        sa.Column("recovery_token_hash", sa.String(), nullable=True),
        sa.Column("recovery_token_expires_at", sa.DateTime(), nullable=True),
        sa.Column("last_activity_at", sa.DateTime(), nullable=False),
        sa.Column("checkout_started_at", sa.DateTime(), nullable=True),
        sa.Column("purchased_at", sa.DateTime(), nullable=True),
        sa.Column("abandoned_at", sa.DateTime(), nullable=True),
        sa.Column("reminder_sent_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_cart_recovery_customer_status", "cart_recovery_sessions", ["customer_id", "status"])
    op.create_index("idx_cart_recovery_anon_status", "cart_recovery_sessions", ["anonymous_id", "status"])
    op.create_index("idx_cart_recovery_email_hash_status", "cart_recovery_sessions", ["email_hash", "status"])
    op.create_index("idx_cart_recovery_status_activity", "cart_recovery_sessions", ["status", "last_activity_at"])

    # -------------------------------------------------- idempotency_keys
    op.create_table(
        "idempotency_keys",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("idempotency_key", sa.String(), nullable=False),
        sa.Column("request_hash", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=True),
        sa.Column("anonymous_id", sa.String(), nullable=True),
        sa.Column("resource_id", sa.String(), nullable=True),
        sa.Column("response_status_code", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("scope", "idempotency_key", name="uq_idempotency_scope_key"),
    )
    op.create_index("idx_idempotency_expires_at", "idempotency_keys", ["expires_at"])

    # -------------------------------------------- promotion_redemptions
    op.create_table(
        "promotion_redemptions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("promotion_id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("customer_id", sa.String(), nullable=True),
        sa.Column("guest_email_hash", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="RESERVED"),
        sa.Column("discount_vnd", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False, server_default="VND"),
        sa.Column("reserved_at", sa.DateTime(), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(), nullable=True),
        sa.Column("released_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("promotion_id", "order_id", name="uq_promo_redemption_order"),
    )
    op.create_index("idx_promo_redemptions_promotion_id", "promotion_redemptions", ["promotion_id"])
    op.create_index("idx_promo_redemptions_order_id", "promotion_redemptions", ["order_id"])
    op.create_index("idx_promo_redemptions_status", "promotion_redemptions", ["status"])

    # -------------------------------------------------- order_promotions
    op.create_table(
        "order_promotions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("promotion_id", sa.String(), nullable=True),
        sa.Column("promotion_code_snapshot", sa.String(), nullable=True),
        sa.Column("promotion_name_snapshot", sa.String(), nullable=False),
        sa.Column("trigger_snapshot", sa.String(), nullable=False),
        sa.Column("scope_type_snapshot", sa.String(), nullable=False),
        sa.Column("discount_type_snapshot", sa.String(), nullable=False),
        sa.Column("discount_vnd", sa.Integer(), nullable=False),
        sa.Column("allocation_snapshot", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["promotion_id"], ["promotions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_order_promotions_order"),
    )
    op.create_index("idx_order_promotions_order_id", "order_promotions", ["order_id"])

    # ----------------------------------------------- alter orders table
    op.add_column("orders", sa.Column("merchandise_subtotal_vnd", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("promotion_discount_vnd", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("shipping_discount_vnd", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("total_discount_vnd", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("campaign_id", sa.String(), sa.ForeignKey("campaigns.id"), nullable=True))
    op.add_column("orders", sa.Column("attribution_snapshot", sa.JSON(), nullable=True))
    op.add_column("orders", sa.Column("cart_recovery_session_id", sa.String(), nullable=True))

    # -------------------------------------------- alter order_items table
    op.add_column("order_items", sa.Column("promotion_discount_vnd", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("order_items", sa.Column("final_line_total_vnd", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    # order_items columns
    op.drop_column("order_items", "final_line_total_vnd")
    op.drop_column("order_items", "promotion_discount_vnd")

    # orders columns
    op.drop_column("orders", "cart_recovery_session_id")
    op.drop_column("orders", "attribution_snapshot")
    op.drop_column("orders", "campaign_id")
    op.drop_column("orders", "total_discount_vnd")
    op.drop_column("orders", "shipping_discount_vnd")
    op.drop_column("orders", "promotion_discount_vnd")
    op.drop_column("orders", "merchandise_subtotal_vnd")

    # order_promotions
    op.drop_index("idx_order_promotions_order_id", "order_promotions")
    op.drop_table("order_promotions")

    # promotion_redemptions
    op.drop_index("idx_promo_redemptions_status", "promotion_redemptions")
    op.drop_index("idx_promo_redemptions_order_id", "promotion_redemptions")
    op.drop_index("idx_promo_redemptions_promotion_id", "promotion_redemptions")
    op.drop_table("promotion_redemptions")

    # idempotency_keys
    op.drop_index("idx_idempotency_expires_at", "idempotency_keys")
    op.drop_table("idempotency_keys")

    # cart_recovery_sessions
    op.drop_index("idx_cart_recovery_status_activity", "cart_recovery_sessions")
    op.drop_index("idx_cart_recovery_email_hash_status", "cart_recovery_sessions")
    op.drop_index("idx_cart_recovery_anon_status", "cart_recovery_sessions")
    op.drop_index("idx_cart_recovery_customer_status", "cart_recovery_sessions")
    op.drop_table("cart_recovery_sessions")

    # commerce_events
    op.drop_index("idx_commerce_events_campaign_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_order_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_product_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_session_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_anon_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_customer_occurred", "commerce_events")
    op.drop_index("idx_commerce_events_name_occurred", "commerce_events")
    op.drop_table("commerce_events")

    # campaign relations
    op.drop_table("campaign_collections")
    op.drop_table("campaign_products")
    op.drop_table("campaign_promotions")

    # campaign_translations
    op.drop_index("idx_campaign_translations_campaign_id", "campaign_translations")
    op.drop_table("campaign_translations")

    # campaigns
    op.drop_index("idx_campaigns_starts_at", "campaigns")
    op.drop_index("idx_campaigns_placement", "campaigns")
    op.drop_index("idx_campaigns_status", "campaigns")
    op.drop_table("campaigns")

    # promotion targets
    op.drop_index("idx_promo_bundle_req_promotion_id", "promotion_bundle_requirements")
    op.drop_table("promotion_bundle_requirements")
    op.drop_table("promotion_payment_method_targets")
    op.drop_table("promotion_collection_targets")
    op.drop_table("promotion_category_targets")
    op.drop_table("promotion_product_targets")

    # promotion_translations
    op.drop_index("idx_promo_translations_promotion_id", "promotion_translations")
    op.drop_table("promotion_translations")

    # promotions
    op.drop_index("idx_promotions_ends_at", "promotions")
    op.drop_index("idx_promotions_starts_at", "promotions")
    op.drop_index("idx_promotions_trigger", "promotions")
    op.drop_index("idx_promotions_status", "promotions")
    op.drop_table("promotions")
