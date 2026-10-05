import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings
from .security import hash_password

# SQLAlchemy setup
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
except Exception:
    engine = None
    SessionLocal = None

Base = declarative_base()


def get_db():
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Default admin user seed for testing/dev fallback
_DEFAULT_ADMIN_ID = "admin-1"
_DEFAULT_ADMIN = {
    "id": _DEFAULT_ADMIN_ID,
    "email": "admin@safelabelai.com",
    "name": "Admin User",
    "display_name": "Admin User",
    "password_hash": hash_password("admin123"),
    "role": "admin",
    "status": "active",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
}

_USERS_DB: Dict[str, Dict[str, Any]] = {_DEFAULT_ADMIN_ID: _DEFAULT_ADMIN}
_PRODUCTS_DB: List[Dict[str, Any]] = [
    {
        "id": "p1",
        "name": "Nutella Hazlenut Spread",
        "barcode": "3017620422003",
        "category": "Food & Beverage",
        "ingredients_text": "sugar, palm oil, hazelnuts, skimmed milk powder",
        "status": "active",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "p2",
        "name": "Quaker Oats",
        "barcode": "030000010204",
        "category": "Breakfast",
        "ingredients_text": "100% rolled oats",
        "status": "active",
        "created_at": "2026-01-02T00:00:00Z",
    },
]
_ALLERGENS_DB: List[Dict[str, Any]] = [
    {"id": "peanut", "name": "Peanuts", "terms": ["peanut", "groundnut", "arachis"]},
    {"id": "tree_nut", "name": "Tree Nuts", "terms": ["almond", "walnut", "hazelnut", "cashew", "pistachio"]},
    {"id": "milk", "name": "Milk & Dairy", "terms": ["milk", "lactose", "whey", "casein", "butter", "cheese", "cream"]},
    {"id": "egg", "name": "Eggs", "terms": ["egg", "albumin", "mayonnaise"]},
    {"id": "soy", "name": "Soybeans", "terms": ["soy", "soya", "soybean", "tofu", "lecithin"]},
    {"id": "gluten", "name": "Gluten & Wheat", "terms": ["wheat", "barley", "rye", "gluten", "flour"]},
]
_SCANS_DB: List[Dict[str, Any]] = []
_SYSTEM_LOGS_DB: List[Dict[str, Any]] = []


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.lower().strip()
    for user in _USERS_DB.values():
        if user["email"].lower() == clean_email:
            return user
    return None


def create_user(
    user_id: Optional[str] = None,
    email: str = "",
    password_hash: str = "",
    display_name: str = "User",
    role: str = "user",
    status: str = "active",
) -> Dict[str, Any]:
    clean_email = email.lower().strip()
    if find_user_by_email(clean_email):
        from psycopg.errors import UniqueViolation
        raise UniqueViolation("Email already exists")

    uid = user_id or str(uuid.uuid4())
    user = {
        "id": uid,
        "email": clean_email,
        "name": display_name,
        "display_name": display_name,
        "password_hash": password_hash,
        "role": role,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _USERS_DB[uid] = user
    return user


def delete_user(user_id: str) -> bool:
    if user_id in _USERS_DB:
        del _USERS_DB[user_id]
        return True
    return False


def list_admin_users() -> List[Dict[str, Any]]:
    return list(_USERS_DB.values())


def admin_stats() -> Dict[str, int]:
    return {
        "users": len(_USERS_DB),
        "products": len(_PRODUCTS_DB),
        "scans": len(_SCANS_DB),
        "detections": sum(len(s.get("detected_allergens", [])) for s in _SCANS_DB),
    }


def list_admin_products() -> List[Dict[str, Any]]:
    return _PRODUCTS_DB


def create_admin_product(
    name: str,
    barcode: Optional[str] = None,
    category: str = "Food & Beverage",
    ingredients_text: str = "",
    status: str = "active",
) -> Dict[str, Any]:
    product = {
        "id": str(uuid.uuid4()),
        "name": name,
        "barcode": barcode,
        "category": category,
        "ingredients_text": ingredients_text,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _PRODUCTS_DB.append(product)
    return product


def delete_admin_product(product_id: str) -> bool:
    global _PRODUCTS_DB
    initial_len = len(_PRODUCTS_DB)
    _PRODUCTS_DB = [p for p in _PRODUCTS_DB if p["id"] != product_id]
    return len(_PRODUCTS_DB) < initial_len


def list_admin_scans() -> List[Dict[str, Any]]:
    return _SCANS_DB


def list_admin_allergens() -> List[Dict[str, Any]]:
    return _ALLERGENS_DB


def create_or_update_allergen(allergen_id: str, name: str, terms: List[str]) -> Dict[str, Any]:
    for item in _ALLERGENS_DB:
        if item["id"] == allergen_id or item["name"].lower() == name.lower():
            item["name"] = name
            item["terms"] = terms
            return item
    new_allergen = {"id": allergen_id, "name": name, "terms": terms}
    _ALLERGENS_DB.append(new_allergen)
    return new_allergen


def delete_allergen(allergen_id: str) -> bool:
    global _ALLERGENS_DB
    initial_len = len(_ALLERGENS_DB)
    _ALLERGENS_DB = [a for a in _ALLERGENS_DB if a["id"] != allergen_id]
    return len(_ALLERGENS_DB) < initial_len


def admin_reports() -> Dict[str, Any]:
    return {
        "total_scans": len(_SCANS_DB),
        "daily_scans": [12, 18, 25, 30, 42, 38, 55],
        "top_allergens": [
            {"allergen": "Peanuts", "count": 142},
            {"allergen": "Milk & Dairy", "count": 98},
            {"allergen": "Gluten & Wheat", "count": 76},
        ],
        "detection_rate": 0.94,
    }


def list_system_logs() -> List[Dict[str, Any]]:
    return _SYSTEM_LOGS_DB


def create_system_log(level: str, event: str, message: str) -> Dict[str, Any]:
    log_entry = {
        "id": str(uuid.uuid4()),
        "level": level,
        "event": event,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _SYSTEM_LOGS_DB.append(log_entry)
    return log_entry