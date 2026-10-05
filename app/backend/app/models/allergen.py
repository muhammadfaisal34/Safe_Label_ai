import uuid
from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from ..core.database import Base


class Allergen(Base):
    __tablename__ = "allergens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, default="General")
    description = Column(Text, nullable=True)
    terms = Column(ARRAY(Text), nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user_allergies = relationship("UserAllergy", back_populates="allergen", cascade="all, delete-orphan")
    ingredient_allergens = relationship("IngredientAllergen", back_populates="allergen", cascade="all, delete-orphan")
    scan_results = relationship("ScanResult", back_populates="allergen")
