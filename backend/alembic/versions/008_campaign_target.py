"""campaign target (product group)

Revision ID: 008
Revises: 007
Create Date: 2026-06-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("campaigns", sa.Column("target_type", sa.String(), nullable=True))
    op.add_column("campaigns", sa.Column("target_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("campaigns", "target_id")
    op.drop_column("campaigns", "target_type")
