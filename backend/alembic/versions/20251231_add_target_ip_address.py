"""add ip_address to targets

Revision ID: 20251231_add_target_ip_address
Revises: 
Create Date: 2025-12-31 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20251231_add_target_ip_address"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("targets", sa.Column("ip_address", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("targets", "ip_address")
