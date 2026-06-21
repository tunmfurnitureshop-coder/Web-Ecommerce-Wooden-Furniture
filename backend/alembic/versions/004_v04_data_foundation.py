"""v04 data foundation — taxonomy, collections, content, discovery, SEO fields

Revision ID: 004
Revises: 003
Create Date: 2026-06-21
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable unaccent extension for accent-insensitive search
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")

    # ------------------------------------------------------------------ tags
    op.create_table(
        "tags",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_tags_code"),
    )
    op.create_index("idx_tags_type", "tags", ["type"])
    op.create_index("idx_tags_is_active", "tags", ["is_active"])

    # -------------------------------------------------------- tag_translations
    op.create_table(
        "tag_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tag_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tag_id", "locale", name="uq_tag_translations_tag_locale"),
        sa.UniqueConstraint("locale", "slug", name="uq_tag_translations_locale_slug"),
    )
    op.create_index("idx_tag_translations_tag_id", "tag_translations", ["tag_id"])
    op.create_index("idx_tag_translations_locale", "tag_translations", ["locale"])

    # ----------------------------------------------------------- product_tags
    op.create_table(
        "product_tags",
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("tag_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
        sa.PrimaryKeyConstraint("product_id", "tag_id"),
        sa.UniqueConstraint("product_id", "tag_id", name="uq_product_tags_product_tag"),
    )
    op.create_index("idx_product_tags_product_id", "product_tags", ["product_id"])
    op.create_index("idx_product_tags_tag_id", "product_tags", ["tag_id"])

    # ----------------------------------------------------------- collections
    op.create_table(
        "collections",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
        sa.Column("cover_image_url", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_collections_code"),
    )
    op.create_index("idx_collections_status", "collections", ["status"])
    op.create_index("idx_collections_is_featured", "collections", ["is_featured"])

    # ------------------------------------------------ collection_translations
    op.create_table(
        "collection_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("collection_id", sa.String(), nullable=False),
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
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("collection_id", "locale", name="uq_collection_translations_collection_locale"),
        sa.UniqueConstraint("locale", "slug", name="uq_collection_translations_locale_slug"),
    )
    op.create_index("idx_collection_translations_collection_id", "collection_translations", ["collection_id"])

    # ------------------------------------------------- collection_products
    op.create_table(
        "collection_products",
        sa.Column("collection_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("collection_id", "product_id"),
        sa.UniqueConstraint("collection_id", "product_id", name="uq_collection_products_collection_product"),
    )
    op.create_index("idx_collection_products_collection_id", "collection_products", ["collection_id"])

    # -------------------------------------------------- product_relations
    op.create_table(
        "product_relations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("source_product_id", sa.String(), nullable=False),
        sa.Column("target_product_id", sa.String(), nullable=False),
        sa.Column("relation_type", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("source_product_id != target_product_id", name="ck_product_relations_no_self"),
        sa.ForeignKeyConstraint(["source_product_id"], ["products.id"]),
        sa.ForeignKeyConstraint(["target_product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_product_id", "target_product_id", "relation_type", name="uq_product_relations_source_target_type"),
    )
    op.create_index("idx_product_relations_source_id", "product_relations", ["source_product_id"])
    op.create_index("idx_product_relations_type", "product_relations", ["relation_type"])

    # ---------------------------------------------------- content_posts
    op.create_table(
        "content_posts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="DRAFT"),
        sa.Column("cover_image_url", sa.Text(), nullable=True),
        sa.Column("author_name", sa.String(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_content_posts_type", "content_posts", ["type"])
    op.create_index("idx_content_posts_status", "content_posts", ["status"])
    op.create_index("idx_content_posts_published_at", "content_posts", ["published_at"])

    # ----------------------------------------- content_post_translations
    op.create_table(
        "content_post_translations",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("content_post_id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("meta_title", sa.String(180), nullable=True),
        sa.Column("meta_description", sa.String(320), nullable=True),
        sa.Column("og_title", sa.String(180), nullable=True),
        sa.Column("og_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["content_post_id"], ["content_posts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("content_post_id", "locale", name="uq_content_post_translations_post_locale"),
        sa.UniqueConstraint("locale", "slug", name="uq_content_post_translations_locale_slug"),
    )
    op.create_index("idx_content_post_translations_post_id", "content_post_translations", ["content_post_id"])

    # ------------------------------------------ content_post_products
    op.create_table(
        "content_post_products",
        sa.Column("content_post_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["content_post_id"], ["content_posts.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("content_post_id", "product_id"),
        sa.UniqueConstraint("content_post_id", "product_id", name="uq_content_post_products_post_product"),
    )

    # ----------------------------------------- content_post_categories
    op.create_table(
        "content_post_categories",
        sa.Column("content_post_id", sa.String(), nullable=False),
        sa.Column("room_category_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["content_post_id"], ["content_posts.id"]),
        sa.ForeignKeyConstraint(["room_category_id"], ["room_categories.id"]),
        sa.PrimaryKeyConstraint("content_post_id", "room_category_id"),
        sa.UniqueConstraint("content_post_id", "room_category_id", name="uq_content_post_categories_post_category"),
    )

    # ------------------------------------------------- search_synonyms
    op.create_table(
        "search_synonyms",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("locale", sa.String(), nullable=False),
        sa.Column("canonical_term", sa.String(), nullable=False),
        sa.Column("synonym_term", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("locale", "synonym_term", name="uq_search_synonyms_locale_synonym"),
    )
    op.create_index("idx_search_synonyms_locale_canonical", "search_synonyms", ["locale", "canonical_term"])

    # -------------------------------- SEO columns on existing translation tables
    seo_columns = [
        sa.Column("meta_title", sa.String(180), nullable=True),
        sa.Column("meta_description", sa.String(320), nullable=True),
        sa.Column("og_title", sa.String(180), nullable=True),
        sa.Column("og_description", sa.String(320), nullable=True),
        sa.Column("og_image_url", sa.Text(), nullable=True),
    ]

    for table in ("product_translations", "room_category_translations", "wood_type_translations"):
        for col in seo_columns:
            op.add_column(table, sa.Column(col.name, col.type, nullable=True))

    # GIN trigram index on tag_translations.name for search
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_tag_translations_name_trgm "
        "ON tag_translations USING gin(name gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_collection_translations_name_trgm "
        "ON collection_translations USING gin(name gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_collection_translations_name_trgm")
    op.execute("DROP INDEX IF EXISTS idx_tag_translations_name_trgm")

    for table in ("wood_type_translations", "room_category_translations", "product_translations"):
        for col in ("og_image_url", "og_description", "og_title", "meta_description", "meta_title"):
            op.drop_column(table, col)

    op.drop_index("idx_search_synonyms_locale_canonical", "search_synonyms")
    op.drop_table("search_synonyms")

    op.drop_table("content_post_categories")
    op.drop_table("content_post_products")

    op.drop_index("idx_content_post_translations_post_id", "content_post_translations")
    op.drop_table("content_post_translations")

    op.drop_index("idx_content_posts_published_at", "content_posts")
    op.drop_index("idx_content_posts_status", "content_posts")
    op.drop_index("idx_content_posts_type", "content_posts")
    op.drop_table("content_posts")

    op.drop_index("idx_product_relations_type", "product_relations")
    op.drop_index("idx_product_relations_source_id", "product_relations")
    op.drop_table("product_relations")

    op.drop_index("idx_collection_products_collection_id", "collection_products")
    op.drop_table("collection_products")

    op.drop_index("idx_collection_translations_collection_id", "collection_translations")
    op.drop_table("collection_translations")

    op.drop_index("idx_collections_is_featured", "collections")
    op.drop_index("idx_collections_status", "collections")
    op.drop_table("collections")

    op.drop_index("idx_product_tags_tag_id", "product_tags")
    op.drop_index("idx_product_tags_product_id", "product_tags")
    op.drop_table("product_tags")

    op.drop_index("idx_tag_translations_locale", "tag_translations")
    op.drop_index("idx_tag_translations_tag_id", "tag_translations")
    op.drop_table("tag_translations")

    op.drop_index("idx_tags_is_active", "tags")
    op.drop_index("idx_tags_type", "tags")
    op.drop_table("tags")
