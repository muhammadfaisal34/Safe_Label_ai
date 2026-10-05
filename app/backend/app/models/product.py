import uuid
from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..core.database import Base


class ProductInfo(Base):
    __tablename__ = "product_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    barcode = Column(String(50), unique=True, index=True, nullable=True)
    product_name = Column(String(200), nullable=False)
    brand = Column(String(100), nullable=True, default="")
    image_url = Column(Text, nullable=True)
    ingredients_text = Column(Text, nullable=False, default="")
    country = Column(String(50), nullable=True, default="")
    category = Column(String(50), nullable=False, default="Food & Beverage")
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    scans = relationship("Scan", back_populates="product")


Product = ProductInfo
