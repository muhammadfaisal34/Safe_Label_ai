"""PostgreSQL ORM models matching SafeLabel AI ERD schema."""

from .admin import AdminLog
from .allergen import Allergen
from .ingredient import Ingredient, IngredientAllergen
from .product import Product, ProductInfo
from .scan import Scan, ScanHistory, ScanResult
from .system import SystemLog
from .translation import Translation
from .user import User, UserAllergy, UserProfile

__all__ = [
    "User",
    "UserProfile",
    "UserAllergy",
    "Allergen",
    "Ingredient",
    "IngredientAllergen",
    "ProductInfo",
    "Product",
    "Scan",
    "ScanResult",
    "ScanHistory",
    "Translation",
    "AdminLog",
    "SystemLog",
]
