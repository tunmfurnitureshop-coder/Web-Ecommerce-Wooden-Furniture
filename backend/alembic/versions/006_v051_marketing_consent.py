"""v0.5.1 marketing consent on customers

Revision ID: 006
Revises: 005
Create Date: 2026-06-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("customers", sa.Column(
        "marketing_opt_in", sa.Boolean(), nullable=False, server_default=sa.false()
    ))
    op.add_column("customers", sa.Column(
        "marketing_opt_in_updated_at", sa.DateTime(), nullable=True
    ))


def downgrade() -> None:
    op.drop_column("customers", "marketing_opt_in_updated_at")
    op.drop_column("customers", "marketing_opt_in")
