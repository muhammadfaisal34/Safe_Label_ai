"""Initial ERD Schema Migration

Revision ID: 001_initial_erd_schema
Revises: 
Create Date: 2026-10-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_erd_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False, server_default="User"),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=True, server_default="User"),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="customer"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_users_email", "users", ["email"], unique=True)

    # 2. user_profiles
    op.create_table(
        "user_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("language", sa.String(length=10), nullable=False, server_default="en"),
        sa.Column("notifications", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_user_profiles_user_id", "user_profiles", ["user_id"], unique=True)

    # 3. allergens
    op.create_table(
        "allergens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="General"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("terms", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_allergens_name", "allergens", ["name"], unique=True)

    # 4. user_allergies
    op.create_table(
        "user_allergies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("allergen_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("allergens.id", ondelete="CASCADE"), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False, server_default="high"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "allergen_id", name="uq_user_allergen"),
    )
    op.create_index("idx_user_allergies_user", "user_allergies", ["user_id"])
    op.create_index("idx_user_allergies_allergen", "user_allergies", ["allergen_id"])

    # 5. ingredients
    op.create_table(
        "ingredients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("normalized_name", sa.String(length=100), nullable=False),
        sa.Column("synonyms", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True, server_default="General"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_ingredients_name", "ingredients", ["name"])
    op.create_index("idx_ingredients_normalized_name", "ingredients", ["normalized_name"])

    # 6. ingredient_allergens
    op.create_table(
        "ingredient_allergens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("allergen_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("allergens.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("ingredient_id", "allergen_id", name="uq_ingredient_allergen"),
    )
    op.create_index("idx_ingredient_allergens_ingredient", "ingredient_allergens", ["ingredient_id"])
    op.create_index("idx_ingredient_allergens_allergen", "ingredient_allergens", ["allergen_id"])

    # 7. product_info
    op.create_table(
        "product_info",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("barcode", sa.String(length=50), nullable=True),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=True, server_default=""),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("ingredients_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("country", sa.String(length=50), nullable=True, server_default=""),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="Food & Beverage"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_product_info_barcode", "product_info", ["barcode"], unique=True)

    # 8. scans
    op.create_table(
        "scans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product_info.id", ondelete="SET NULL"), nullable=True),
        sa.Column("barcode", sa.String(length=50), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=False, server_default=""),
        sa.Column("language", sa.String(length=10), nullable=True, server_default="en"),
        sa.Column("source", sa.String(length=20), nullable=False, server_default="ocr"),
        sa.Column("verdict", sa.String(length=20), nullable=False, server_default="safe"),
        sa.Column("detected_allergens", postgresql.ARRAY(sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_scans_user", "scans", ["user_id"])
    op.create_index("idx_scans_barcode", "scans", ["barcode"])
    op.create_index("idx_scans_created", "scans", ["created_at"])

    # 9. scan_results
    op.create_table(
        "scan_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True),
        sa.Column("allergen_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("allergens.id", ondelete="SET NULL"), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0.90"),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_scan_results_scan", "scan_results", ["scan_id"])

    # 10. scan_history
    op.create_table(
        "scan_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scan_type", sa.String(length=20), nullable=False, server_default="image"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_scan_history_user", "scan_history", ["user_id"])

    # 11. translations
    op.create_table(
        "translations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scans.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_text", sa.Text(), nullable=False),
        sa.Column("translated_text", sa.Text(), nullable=False),
        sa.Column("source_language", sa.String(length=10), nullable=False),
        sa.Column("target_language", sa.String(length=10), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False, server_default="google"),
        sa.Column("confidence", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0.95"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # 12. admin_logs
    op.create_table(
        "admin_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_table", sa.String(length=50), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("idx_admin_logs_user", "admin_logs", ["user_id"])

    # 13. system_logs
    op.create_table(
        "system_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("level", sa.String(length=20), nullable=False, server_default="INFO"),
        sa.Column("event", sa.String(length=100), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("system_logs")
    op.drop_table("admin_logs")
    op.drop_table("translations")
    op.drop_table("scan_history")
    op.drop_table("scan_results")
    op.drop_table("scans")
    op.drop_table("product_info")
    op.drop_table("ingredient_allergens")
    op.drop_table("ingredients")
    op.drop_table("user_allergies")
    op.drop_table("allergens")
    op.drop_table("user_profiles")
    op.drop_table("users")
