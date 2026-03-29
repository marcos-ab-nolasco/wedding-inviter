"""add weddings table and link users

Revision ID: a1b2c3d4e5f6
Revises: 63a40d8ceeaf
Create Date: 2026-03-29 00:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '63a40d8ceeaf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'weddings',
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_weddings_id'), 'weddings', ['id'], unique=False)

    op.add_column('users', sa.Column('wedding_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_users_wedding_id', 'users', 'weddings', ['wedding_id'], ['id']
    )
    op.create_index(op.f('ix_users_wedding_id'), 'users', ['wedding_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_wedding_id'), table_name='users')
    op.drop_constraint('fk_users_wedding_id', 'users', type_='foreignkey')
    op.drop_column('users', 'wedding_id')
    op.drop_index(op.f('ix_weddings_id'), table_name='weddings')
    op.drop_table('weddings')
