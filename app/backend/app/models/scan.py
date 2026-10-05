import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import relationship

from ..core.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("product_info.id", ondelete="SET NULL"), nullable=True, index=True)
    barcode = Column(String(50), nullable=True, index=True)
    image_url = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=False, default="")
    language = Column(String(10), nullable=True, default="en")
    source = Column(String(20), nullable=False, default="ocr")
    verdict = Column(String(20), nullable=False, default="safe")
    detected_allergens = Column(ARRAY(Text), nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="scans")
    product = relationship("ProductInfo", back_populates="scans")
    scan_results = relationship("ScanResult", back_populates="scan", cascade="all, delete-orphan")
    translations = relationship("Translation", back_populates="scan", cascade="all, delete-orphan")
    history_entries = relationship("ScanHistory", back_populates="scan", cascade="all, delete-orphan")


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="SET NULL"), nullable=True, index=True)
    allergen_id = Column(UUID(as_uuid=True), ForeignKey("allergens.id", ondelete="SET NULL"), nullable=True, index=True)
    confidence = Column(Numeric(5, 2), nullable=False, default=0.90)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    scan = relationship("Scan", back_populates="scan_results")
    ingredient = relationship("Ingredient", back_populates="scan_results")
    allergen = relationship("Allergen", back_populates="scan_results")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    scan_type = Column(String(20), nullable=False, default="image")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="scan_histories")
    scan = relationship("Scan", back_populates="history_entries")
