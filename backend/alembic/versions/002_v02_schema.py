"""v02 schema additions

Revision ID: 002
Revises: 001
Create Date: 2026-06-19
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("payment_provider", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("latest_payment_transaction_id", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("payment_completed_at", sa.DateTime(), nullable=True))

    op.create_table(
        "payment_transactions",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("amount_vnd", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(), nullable=True, server_default="VND"),
        sa.Column("provider_transaction_id", sa.String(), nullable=True),
        sa.Column("provider_payment_link_id", sa.String(), nullable=True),
        sa.Column("provider_order_code", sa.String(), nullable=True),
        sa.Column("checkout_url", sa.Text(), nullable=True),
        sa.Column("qr_code", sa.Text(), nullable=True),
        sa.Column("raw_request", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("raw_response", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("expired_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("amount_vnd >= 0", name="ck_payment_transactions_amount"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_payment_transactions_order_id", "payment_transactions", ["order_id"])
    op.create_index("idx_payment_transactions_provider_order_code", "payment_transactions", ["provider_order_code"])
    op.create_index("idx_payment_transactions_provider_payment_link_id", "payment_transactions", ["provider_payment_link_id"])

    op.create_table(
        "webhook_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("external_event_id", sa.String(), nullable=True),
        sa.Column("event_type", sa.String(), nullable=True),
        sa.Column("signature", sa.String(), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("processing_status", sa.String(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_webhook_provider_external_event", "webhook_events", ["provider", "external_event_id"])
    op.create_index("idx_webhook_status", "webhook_events", ["processing_status"])
    op.create_index("idx_webhook_created_at", "webhook_events", ["created_at"])

    op.create_table(
        "product_images",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("bucket_name", sa.String(), nullable=False),
        sa.Column("alt_text", sa.String(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("is_primary", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("linked_finish_code", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_product_images_product_id", "product_images", ["product_id"])
    op.create_index("idx_product_images_storage_key", "product_images", ["storage_key"])

    op.create_table(
        "email_logs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("recipient_email", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("template_key", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("related_order_id", sa.String(), nullable=True),
        sa.Column("related_payment_transaction_id", sa.String(), nullable=True),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["related_order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_email_logs_order_id", "email_logs", ["related_order_id"])
    op.create_index("idx_email_logs_status", "email_logs", ["status"])
    op.create_index("idx_email_logs_created_at", "email_logs", ["created_at"])

    op.create_table(
        "order_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("order_id", sa.String(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("old_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("new_value", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("actor_type", sa.String(), nullable=False),
        sa.Column("actor_id", sa.String(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_order_events_order_id", "order_events", ["order_id"])


def downgrade() -> None:
    op.drop_index("idx_order_events_order_id", "order_events")
    op.drop_table("order_events")
    op.drop_index("idx_email_logs_created_at", "email_logs")
    op.drop_index("idx_email_logs_status", "email_logs")
    op.drop_index("idx_email_logs_order_id", "email_logs")
    op.drop_table("email_logs")
    op.drop_index("idx_product_images_storage_key", "product_images")
    op.drop_index("idx_product_images_product_id", "product_images")
    op.drop_table("product_images")
    op.drop_index("idx_webhook_created_at", "webhook_events")
    op.drop_index("idx_webhook_status", "webhook_events")
    op.drop_index("idx_webhook_provider_external_event", "webhook_events")
    op.drop_table("webhook_events")
    op.drop_index("idx_payment_transactions_provider_payment_link_id", "payment_transactions")
    op.drop_index("idx_payment_transactions_provider_order_code", "payment_transactions")
    op.drop_index("idx_payment_transactions_order_id", "payment_transactions")
    op.drop_table("payment_transactions")
    op.drop_column("orders", "payment_completed_at")
    op.drop_column("orders", "latest_payment_transaction_id")
    op.drop_column("orders", "payment_provider")
