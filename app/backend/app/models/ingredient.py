import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..core.database import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    normalized_name = Column(String(100), nullable=False, index=True)
    synonyms = Column(Text, nullable=True)
    category = Column(String(50), nullable=True, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ingredient_allergens = relationship("IngredientAllergen", back_populates="ingredient", cascade="all, delete-orphan")
    scan_results = relationship("ScanResult", back_populates="ingredient")


class IngredientAllergen(Base):
    __tablename__ = "ingredient_allergens"
    __table_args__ = (UniqueConstraint("ingredient_id", "allergen_id", name="uq_ingredient_allergen"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)
    allergen_id = Column(UUID(as_uuid=True), ForeignKey("allergens.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ingredient = relationship("Ingredient", back_populates="ingredient_allergens")
    allergen = relationship("Allergen", back_populates="ingredient_allergens")
