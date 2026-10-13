import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, func, String
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


from datetime import datetime, timezone, timedelta
import random

_2FA_CODES: Dict[str, Dict[str, Any]] = {}


def generate_2fa_code(email: str) -> str:
    clean_email = email.lower().strip()
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    _2FA_CODES[clean_email] = {
        "code": code,
        "expires_at": expires_at,
    }
    return code


def verify_2fa_code(email: str, code: str) -> bool:
    clean_email = email.lower().strip()
    data = _2FA_CODES.get(clean_email)
    if not data:
        return False
    if datetime.now(timezone.utc) > data["expires_at"]:
        del _2FA_CODES[clean_email]
        return False
    if data["code"].strip() == code.strip():
        del _2FA_CODES[clean_email]
        update_user_status(clean_email, "active")
        return True
    return False


def update_user_status(email_or_id: str, new_status: str = "active") -> bool:
    clean_identifier = email_or_id.lower().strip()
    updated = False
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            u = db.query(User).filter(func.lower(User.email) == clean_identifier).first()
            if u:
                u.status = new_status
                db.commit()
                updated = True
        except Exception:
            db.rollback()
        finally:
            db.close()

    for user in _USERS_DB.values():
        if user["email"].lower() == clean_identifier or user["id"] == email_or_id:
            user["status"] = new_status
            updated = True
    return updated


# In-memory fallback dictionary for offline/test mode
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
_DEFAULT_SCANS: List[Dict[str, Any]] = [
    {
        "id": "scan-demo-1",
        "product_name": "Nutella Hazelnut Spread",
        "barcode": "3017620422003",
        "user_name": "Admin User",
        "verdict": "danger",
        "source": "barcode",
        "extracted_text": "Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
        "detected_allergens": ["Tree Nuts", "Milk & Dairy", "Soybeans"],
        "created_at": "2026-10-13T12:45:00Z",
    },
    {
        "id": "scan-demo-2",
        "product_name": "Quaker Quick 1-Minute Oats",
        "barcode": "030000010204",
        "user_name": "Faisal",
        "verdict": "safe",
        "source": "ocr",
        "extracted_text": "100% whole grain rolled oats. May contain traces of wheat.",
        "detected_allergens": [],
        "created_at": "2026-10-13T11:15:00Z",
    },
    {
        "id": "scan-demo-3",
        "product_name": "Nature Valley Crunchy Granola Bars",
        "barcode": "016000275270",
        "user_name": "Sarah Jenkins",
        "verdict": "danger",
        "source": "ocr",
        "extracted_text": "Whole Grain Oats, Sugar, Canola Oil, Rice Flour, Honey, Brown Sugar Syrup, Salt, Soy Lecithin, Peanuts, Almonds",
        "detected_allergens": ["Peanuts", "Tree Nuts", "Soybeans"],
        "created_at": "2026-10-12T16:30:00Z",
    },
    {
        "id": "scan-demo-4",
        "product_name": "Almond Breeze Almondmilk Vanilla",
        "barcode": "041570056214",
        "user_name": "Faisal",
        "verdict": "caution",
        "source": "barcode",
        "extracted_text": "Almondmilk (Filtered Water, Almonds), Cane Sugar, Calcium Carbonate, Sea Salt, Potassium Citrate, Sunflower Lecithin, Gellan Gum",
        "detected_allergens": ["Tree Nuts"],
        "created_at": "2026-10-12T14:10:00Z",
    },
    {
        "id": "scan-demo-5",
        "product_name": "Oreo Original Sandwich Cookies",
        "barcode": "044000032029",
        "user_name": "User 2FA",
        "verdict": "danger",
        "source": "ocr",
        "extracted_text": "Unbleached Enriched Flour (Wheat Flour, Niacin, Reduced Iron), Sugar, Palm Oil, Soybean Oil, Cocoa, High Fructose Corn Syrup, Soy Lecithin",
        "detected_allergens": ["Gluten & Wheat", "Soybeans"],
        "created_at": "2026-10-11T18:20:00Z",
    },
    {
        "id": "scan-demo-6",
        "product_name": "Kinder Bueno Milk Chocolate",
        "barcode": "8000500023976",
        "user_name": "Admin User",
        "verdict": "danger",
        "source": "barcode",
        "extracted_text": "Milk chocolate 31.5%, sugar, palm oil, wheat flour, hazelnuts (10.5%), skimmed milk powder, milk powder, chocolate, emulsifier lecithins (soy)",
        "detected_allergens": ["Milk & Dairy", "Tree Nuts", "Gluten & Wheat", "Soybeans"],
        "created_at": "2026-10-11T10:05:00Z",
    },
    {
        "id": "scan-demo-7",
        "product_name": "Organic Baby Spinach",
        "barcode": "078742234014",
        "user_name": "Sarah Jenkins",
        "verdict": "safe",
        "source": "ocr",
        "extracted_text": "100% Organic Baby Spinach. Washed and ready to eat.",
        "detected_allergens": [],
        "created_at": "2026-10-10T15:40:00Z",
    },
    {
        "id": "scan-demo-8",
        "product_name": "Barilla Classic Basil Pesto",
        "barcode": "076808000450",
        "user_name": "Faisal",
        "verdict": "caution",
        "source": "barcode",
        "extracted_text": "Sunflower oil, Italian basil 30%, cashews, Grana Padano cheese 4.5% (contains egg lysozyme), whey powder (milk), salt",
        "detected_allergens": ["Milk & Dairy", "Tree Nuts"],
        "created_at": "2026-10-10T09:25:00Z",
    },
]

_SCANS_DB: List[Dict[str, Any]] = []
_SYSTEM_LOGS_DB: List[Dict[str, Any]] = []


def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.lower().strip()
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            u = db.query(User).filter(func.lower(User.email) == clean_email).first()
            if u:
                return {
                    "id": str(u.id),
                    "email": u.email,
                    "name": u.name or u.display_name or "User",
                    "display_name": u.display_name or u.name or "User",
                    "password_hash": u.password_hash,
                    "role": u.role,
                    "status": u.status,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "updated_at": u.updated_at.isoformat() if u.updated_at else None,
                }
        except Exception:
            pass
        finally:
            db.close()

    for user in _USERS_DB.values():
        if user["email"].lower() == clean_email:
            return user
    return None


def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            try:
                uid_obj = uuid.UUID(user_id)
                u = db.query(User).filter(User.id == uid_obj).first()
            except Exception:
                u = None
            if u:
                return {
                    "id": str(u.id),
                    "email": u.email,
                    "name": u.name or u.display_name or "User",
                    "display_name": u.display_name or u.name or "User",
                    "password_hash": u.password_hash,
                    "role": u.role,
                    "status": u.status,
                    "created_at": u.created_at.isoformat() if u.created_at else None,
                    "updated_at": u.updated_at.isoformat() if u.updated_at else None,
                }
        except Exception:
            pass
        finally:
            db.close()

    return _USERS_DB.get(user_id)


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
    user_dict = {
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

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User, UserProfile
            new_user = User(
                id=uuid.UUID(uid),
                name=display_name,
                email=clean_email,
                password_hash=password_hash,
                display_name=display_name,
                role=role,
                status=status,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            # Create associated user profile
            profile = UserProfile(id=uuid.uuid4(), user_id=new_user.id)
            db.add(profile)
            db.commit()

            _USERS_DB[uid] = user_dict
            return user_dict
        except Exception:
            db.rollback()
        finally:
            db.close()

    _USERS_DB[uid] = user_dict
    return user_dict


def delete_user(user_id: str) -> bool:
    deleted = False
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            uid_obj = uuid.UUID(user_id)
            u = db.query(User).filter(User.id == uid_obj).first()
            if u:
                db.delete(u)
                db.commit()
                deleted = True
        except Exception:
            db.rollback()
        finally:
            db.close()

    if user_id in _USERS_DB:
        del _USERS_DB[user_id]
        deleted = True
    return deleted


def list_admin_users() -> List[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            users = db.query(User).filter(User.role != "admin").order_by(User.created_at.desc()).all()
            if users:
                return [
                    {
                        "id": str(u.id),
                        "email": u.email,
                        "name": u.name or u.display_name or "User",
                        "display_name": u.display_name or u.name or "User",
                        "role": u.role,
                        "status": u.status,
                        "created_at": u.created_at.isoformat() if u.created_at else None,
                    }
                    for u in users
                ]
        except Exception:
            pass
        finally:
            db.close()

    return [u for u in _USERS_DB.values() if u.get("role") != "admin"]


def admin_stats() -> Dict[str, int]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            from ..models.product import ProductInfo
            from ..models.scan import Scan

            u_count = db.query(func.count(User.id)).scalar() or 0
            p_count = db.query(func.count(ProductInfo.id)).scalar() or 0
            s_count = db.query(func.count(Scan.id)).scalar() or 0
            
            # Count scans with danger verdict as detections
            d_count = db.query(func.count(Scan.id)).filter(Scan.verdict == "danger").scalar() or 0
            return {
                "users": u_count,
                "products": p_count,
                "scans": s_count,
                "detections": d_count,
            }
        except Exception:
            pass
        finally:
            db.close()

    return {
        "users": len(_USERS_DB),
        "products": len(_PRODUCTS_DB),
        "scans": len(_SCANS_DB),
        "detections": sum(len(s.get("detected_allergens", [])) for s in _SCANS_DB),
    }


def list_admin_products() -> List[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.product import ProductInfo
            products = db.query(ProductInfo).order_by(ProductInfo.created_at.desc()).all()
            if products:
                return [
                    {
                        "id": str(p.id),
                        "name": p.product_name,
                        "barcode": p.barcode,
                        "category": p.category,
                        "ingredients_text": p.ingredients_text,
                        "status": p.status,
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                    for p in products
                ]
        except Exception:
            pass
        finally:
            db.close()

    return _PRODUCTS_DB


def create_admin_product(
    name: str,
    barcode: Optional[str] = None,
    category: str = "Food & Beverage",
    ingredients_text: str = "",
    status: str = "active",
) -> Dict[str, Any]:
    pid = str(uuid.uuid4())
    product_dict = {
        "id": pid,
        "name": name,
        "barcode": barcode,
        "category": category,
        "ingredients_text": ingredients_text,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.product import ProductInfo
            p = ProductInfo(
                id=uuid.UUID(pid),
                product_name=name,
                barcode=barcode if barcode else None,
                category=category,
                ingredients_text=ingredients_text,
                status=status,
            )
            db.add(p)
            db.commit()
            db.refresh(p)
            _PRODUCTS_DB.append(product_dict)
            return product_dict
        except Exception:
            db.rollback()
        finally:
            db.close()

    _PRODUCTS_DB.append(product_dict)
    return product_dict


def delete_admin_product(product_id: str) -> bool:
    deleted = False
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.product import ProductInfo
            try:
                pid_obj = uuid.UUID(product_id)
                p = db.query(ProductInfo).filter(ProductInfo.id == pid_obj).first()
            except Exception:
                p = None
            if p:
                db.delete(p)
                db.commit()
                deleted = True
        except Exception:
            db.rollback()
        finally:
            db.close()

    global _PRODUCTS_DB
    initial_len = len(_PRODUCTS_DB)
    _PRODUCTS_DB = [p for p in _PRODUCTS_DB if p["id"] != product_id]
    if len(_PRODUCTS_DB) < initial_len:
        deleted = True
    return deleted


def list_admin_scans() -> List[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan
            from ..models.product import ProductInfo
            from ..models.user import User

            scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
            res = []
            for s in scans:
                p_name = "Scanned Label"
                if s.product_id:
                    p = db.query(ProductInfo).filter(ProductInfo.id == s.product_id).first()
                    if p and p.product_name:
                        p_name = p.product_name
                elif s.barcode:
                    p = db.query(ProductInfo).filter(ProductInfo.barcode == s.barcode).first()
                    if p and p.product_name:
                        p_name = p.product_name

                u_name = "Anonymous User"
                if s.user_id:
                    u = db.query(User).filter(User.id == s.user_id).first()
                    if u:
                        u_name = u.display_name or u.name or u.email

                res.append({
                    "id": str(s.id),
                    "product_name": p_name,
                    "user_name": u_name,
                    "verdict": s.verdict,
                    "source": s.source,
                    "barcode": s.barcode or "",
                    "image_url": s.image_url or "",
                    "extracted_text": s.extracted_text or "",
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "detected_allergens": list(s.detected_allergens or []),
                })
            return res
        except Exception as e:
            print(f"Error querying scans: {e}")
        finally:
            db.close()

    return _SCANS_DB


def record_scan(
    product_name: Optional[str] = None,
    barcode: Optional[str] = None,
    image_url: Optional[str] = None,
    extracted_text: str = "",
    language: str = "en",
    source: str = "ocr",
    verdict: str = "safe",
    detected_allergens: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = None,
) -> Dict[str, Any]:
    global _SCANS_DB
    allergens_list = list(detected_allergens or [])
    src = (source or "ocr").lower()
    vrd = (verdict or "safe").lower()
    now_dt = datetime.now(timezone.utc)
    scan_id_str = str(uuid.uuid4())

    p_clean_name = (product_name or "").strip()
    if not p_clean_name:
        p_clean_name = f"Barcode {barcode}" if barcode else "Scanned Product Label"

    u_name = "Anonymous User"
    user_uuid = None
    prod_uuid = None

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan, ScanResult, ScanHistory
            from ..models.product import ProductInfo
            from ..models.user import User
            from ..models.allergen import Allergen

            # Find user
            if user_id:
                try:
                    u_obj = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
                    if u_obj:
                        user_uuid = u_obj.id
                        u_name = u_obj.display_name or u_obj.name or u_obj.email
                except Exception:
                    pass

            if not user_uuid and user_email:
                u_obj = db.query(User).filter(func.lower(User.email) == user_email.lower().strip()).first()
                if u_obj:
                    user_uuid = u_obj.id
                    u_name = u_obj.display_name or u_obj.name or u_obj.email
                else:
                    u_name = user_email

            # Find or create ProductInfo
            if barcode:
                p_obj = db.query(ProductInfo).filter(ProductInfo.barcode == barcode).first()
                if p_obj:
                    prod_uuid = p_obj.id
                    if p_clean_name.startswith("Barcode ") and p_obj.product_name:
                        p_clean_name = p_obj.product_name

            if not prod_uuid and p_clean_name and not p_clean_name.startswith("Scanned Product"):
                p_obj = db.query(ProductInfo).filter(func.lower(ProductInfo.product_name) == p_clean_name.lower()).first()
                if p_obj:
                    prod_uuid = p_obj.id
                else:
                    try:
                        p_new = ProductInfo(
                            id=uuid.uuid4(),
                            product_name=p_clean_name,
                            barcode=barcode,
                            ingredients_text=extracted_text,
                            category="Food & Beverage",
                            status="active",
                        )
                        db.add(p_new)
                        db.commit()
                        db.refresh(p_new)
                        prod_uuid = p_new.id
                    except Exception:
                        db.rollback()

            # Create Scan
            scan_obj = Scan(
                id=uuid.UUID(scan_id_str),
                user_id=user_uuid,
                product_id=prod_uuid,
                barcode=barcode,
                image_url=image_url,
                extracted_text=extracted_text,
                language=language or "en",
                source=src,
                verdict=vrd,
                detected_allergens=allergens_list,
                created_at=now_dt,
            )
            db.add(scan_obj)
            db.commit()

            # Create ScanHistory if user found
            if user_uuid:
                try:
                    sh = ScanHistory(
                        id=uuid.uuid4(),
                        user_id=user_uuid,
                        scan_id=scan_obj.id,
                        scan_type=src,
                        created_at=now_dt,
                    )
                    db.add(sh)
                    db.commit()
                except Exception:
                    db.rollback()

            # Create ScanResult for detected allergens
            for a_name in allergens_list:
                try:
                    a_match = db.query(Allergen).filter(func.lower(Allergen.name) == a_name.lower()).first()
                    sr = ScanResult(
                        id=uuid.uuid4(),
                        scan_id=scan_obj.id,
                        allergen_id=a_match.id if a_match else None,
                        confidence=0.95,
                        reason=f"Detected matching allergen: {a_name}",
                        created_at=now_dt,
                    )
                    db.add(sr)
                except Exception:
                    pass
            db.commit()

        except Exception as e:
            print(f"Error persisting scan: {e}")
            db.rollback()
        finally:
            db.close()

    scan_dict = {
        "id": scan_id_str,
        "product_name": p_clean_name,
        "user_name": u_name,
        "verdict": vrd,
        "source": src,
        "barcode": barcode or "",
        "image_url": image_url or "",
        "extracted_text": extracted_text or "",
        "detected_allergens": allergens_list,
        "created_at": now_dt.isoformat(),
    }

    _SCANS_DB.insert(0, scan_dict)
    create_system_log("INFO", "SCAN_RECORDED", f"Scan recorded for '{p_clean_name}' (Verdict: {vrd.upper()}, Source: {src})")
    return scan_dict


def delete_admin_scan(scan_id: str) -> bool:
    deleted = False
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan, ScanResult, ScanHistory
            try:
                sid_obj = uuid.UUID(scan_id)
                s = db.query(Scan).filter(Scan.id == sid_obj).first()
            except Exception:
                s = None
            if s:
                db.delete(s)
                db.commit()
                deleted = True
        except Exception:
            db.rollback()
        finally:
            db.close()

    global _SCANS_DB
    initial_len = len(_SCANS_DB)
    _SCANS_DB = [s for s in _SCANS_DB if str(s.get("id")) != scan_id]
    if len(_SCANS_DB) < initial_len:
        deleted = True
    if deleted:
        create_system_log("INFO", "SCAN_DELETED", f"Scan log {scan_id} deleted by administrator.")
    return deleted


def clear_admin_scans() -> bool:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan, ScanResult, ScanHistory
            db.query(ScanResult).delete()
            db.query(ScanHistory).delete()
            db.query(Scan).delete()
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    global _SCANS_DB
    _SCANS_DB.clear()
    create_system_log("INFO", "SCANS_CLEARED", "All scan logs cleared by administrator.")
    return True


def list_admin_allergens() -> List[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.allergen import Allergen
            allergens = db.query(Allergen).all()
            if allergens:
                return [
                    {
                        "id": a.name.lower().replace(" ", "_"),
                        "name": a.name,
                        "category": a.category,
                        "terms": list(a.terms or []),
                    }
                    for a in allergens
                ]
        except Exception:
            pass
        finally:
            db.close()

    return _ALLERGENS_DB


def create_or_update_allergen(allergen_id: str, name: str, terms: List[str]) -> Dict[str, Any]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.allergen import Allergen
            clean_name = name.strip()
            a = db.query(Allergen).filter(func.lower(Allergen.name) == clean_name.lower()).first()
            if not a:
                a = Allergen(id=uuid.uuid4(), name=clean_name, terms=terms, category="General")
                db.add(a)
            else:
                a.name = clean_name
                a.terms = terms
            db.commit()
            db.refresh(a)
            return {
                "id": allergen_id,
                "name": a.name,
                "terms": list(a.terms or []),
            }
        except Exception:
            db.rollback()
        finally:
            db.close()

    for item in _ALLERGENS_DB:
        if item["id"] == allergen_id or item["name"].lower() == name.lower():
            item["name"] = name
            item["terms"] = terms
            return item
    new_allergen = {"id": allergen_id, "name": name, "terms": terms}
    _ALLERGENS_DB.append(new_allergen)
    return new_allergen


def delete_allergen(allergen_id: str) -> bool:
    deleted = False
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.allergen import Allergen
            a = db.query(Allergen).filter(func.lower(Allergen.name) == allergen_id.replace("_", " ").lower()).first()
            if a:
                db.delete(a)
                db.commit()
                deleted = True
        except Exception:
            db.rollback()
        finally:
            db.close()

    global _ALLERGENS_DB
    initial_len = len(_ALLERGENS_DB)
    _ALLERGENS_DB = [a for a in _ALLERGENS_DB if a["id"] != allergen_id]
    if len(_ALLERGENS_DB) < initial_len:
        deleted = True
    return deleted


def admin_reports(
    days: Optional[int] = None,
    verdict: Optional[str] = None,
    source: Optional[str] = None,
) -> Dict[str, Any]:
    cutoff = None
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    vrd_filter = verdict.strip().lower() if verdict and verdict.strip().lower() not in ("all", "") else None
    src_filter = source.strip().lower() if source and source.strip().lower() not in ("all", "") else None

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan
            from ..models.product import ProductInfo
            from ..models.user import User
            from ..models.allergen import Allergen

            base_q = db.query(Scan)
            if cutoff:
                base_q = base_q.filter(Scan.created_at >= cutoff)
            if src_filter:
                base_q = base_q.filter(Scan.source == src_filter)

            # Core counts
            safe_cnt = base_q.filter(Scan.verdict == "safe").count()
            danger_cnt = base_q.filter(Scan.verdict == "danger").count()
            caution_cnt = base_q.filter(Scan.verdict == "caution").count()
            total_scans = safe_cnt + danger_cnt + caution_cnt
            safety_rate = round((safe_cnt / total_scans * 100), 1) if total_scans > 0 else 0.0

            # Unique products scanned
            unique_products = (
                base_q.filter((Scan.product_id.isnot(None)) | (Scan.barcode.isnot(None)))
                .with_entities(func.coalesce(Scan.barcode, func.cast(Scan.product_id, String)))
                .distinct()
                .count()
            )

            # Unique scanning users
            unique_users = (
                base_q.filter(Scan.user_id.isnot(None))
                .with_entities(Scan.user_id)
                .distinct()
                .count()
            )

            # Source breakdown (dynamically computed from DB)
            source_rows = (
                base_q.with_entities(Scan.source, func.count(Scan.id))
                .group_by(Scan.source)
                .all()
            )
            sources = {row[0] or "unknown": row[1] for row in source_rows}

            # Verdict percentages
            verdict_percentages = {
                "safe": round(safe_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
                "danger": round(danger_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
                "caution": round(caution_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
            }

            # Top Detected Allergens (normalized using Allergen table terms)
            canonical_map = {}
            try:
                allergen_records = db.query(Allergen).all()
                for a in allergen_records:
                    canonical_map[a.name.lower()] = a.name
                    for t in (a.terms or []):
                        canonical_map[t.lower()] = a.name
            except Exception:
                pass

            scans_with_allergens = (
                base_q.filter(Scan.detected_allergens.isnot(None))
                .with_entities(Scan.detected_allergens)
                .all()
            )
            allergen_counts = {}
            total_allergen_occurrences = 0
            for (allg_list,) in scans_with_allergens:
                if not allg_list:
                    continue
                seen_in_scan = set()
                for item in allg_list:
                    if not item:
                        continue
                    clean_item = str(item).strip()
                    canonical_name = canonical_map.get(clean_item.lower(), clean_item.title())
                    if canonical_name not in seen_in_scan:
                        seen_in_scan.add(canonical_name)
                        allergen_counts[canonical_name] = allergen_counts.get(canonical_name, 0) + 1
                        total_allergen_occurrences += 1

            top_allergens = [
                {
                    "name": name,
                    "count": count,
                    "percentage": round(count / total_scans * 100, 1) if total_scans > 0 else 0.0,
                }
                for name, count in sorted(allergen_counts.items(), key=lambda x: x[1], reverse=True)
            ]

            total_flagged = danger_cnt + caution_cnt
            avg_allergens_per_flagged = (
                round(total_allergen_occurrences / total_flagged, 1) if total_flagged > 0 else 0.0
            )

            # Daily timeline trend (up to requested days, default 14 days)
            timeline_days = days if (days and days <= 30) else 14
            today = datetime.now(timezone.utc).date()
            daily_stats = {}
            for i in range(timeline_days - 1, -1, -1):
                d = today - timedelta(days=i)
                d_str = d.isoformat()
                daily_stats[d_str] = {
                    "date": d_str,
                    "label": d.strftime("%b %d"),
                    "total": 0,
                    "safe": 0,
                    "danger": 0,
                    "caution": 0,
                }

            start_timeline_date = today - timedelta(days=timeline_days - 1)
            timeline_scans = (
                base_q.filter(func.date(Scan.created_at) >= start_timeline_date)
                .with_entities(func.date(Scan.created_at), Scan.verdict, func.count(Scan.id))
                .group_by(func.date(Scan.created_at), Scan.verdict)
                .all()
            )
            for dt_val, vrd, cnt in timeline_scans:
                dt_key = dt_val.isoformat() if hasattr(dt_val, "isoformat") else str(dt_val)
                if dt_key in daily_stats:
                    daily_stats[dt_key]["total"] += cnt
                    if vrd in ("safe", "danger", "caution"):
                        daily_stats[dt_key][vrd] += cnt

            daily_timeline = list(daily_stats.values())

            # Category risk breakdown from ProductInfo join
            cat_scans = (
                db.query(ProductInfo.category, Scan.verdict, func.count(Scan.id))
                .outerjoin(ProductInfo, (Scan.product_id == ProductInfo.id) | (Scan.barcode == ProductInfo.barcode))
            )
            if cutoff:
                cat_scans = cat_scans.filter(Scan.created_at >= cutoff)
            if src_filter:
                cat_scans = cat_scans.filter(Scan.source == src_filter)

            cat_rows = cat_scans.group_by(ProductInfo.category, Scan.verdict).all()
            category_data = {}
            for cat_name_raw, vrd, cnt in cat_rows:
                cat_name = cat_name_raw or "Direct Scan / Label"
                if cat_name not in category_data:
                    category_data[cat_name] = {
                        "category": cat_name,
                        "total": 0,
                        "safe": 0,
                        "danger": 0,
                        "caution": 0,
                    }
                category_data[cat_name]["total"] += cnt
                if vrd in ("safe", "danger", "caution"):
                    category_data[cat_name][vrd] += cnt

            category_risk = []
            for c_name, c_vals in category_data.items():
                c_total = c_vals["total"]
                c_danger = c_vals["danger"]
                risk_rate = round(c_danger / c_total * 100, 1) if c_total > 0 else 0.0
                category_risk.append({
                    "category": c_name,
                    "total": c_total,
                    "safe": c_vals["safe"],
                    "danger": c_danger,
                    "caution": c_vals["caution"],
                    "risk_rate": risk_rate,
                })
            category_risk.sort(key=lambda x: (x["danger"], x["total"]), reverse=True)

            # Recent scans list matching filters
            recent_q = base_q
            if vrd_filter:
                recent_q = recent_q.filter(Scan.verdict == vrd_filter)
            recent_objs = recent_q.order_by(Scan.created_at.desc()).limit(50).all()

            recent_scans = []
            for s in recent_objs:
                p_name = "Scanned Label"
                if s.product_id:
                    p = db.query(ProductInfo).filter(ProductInfo.id == s.product_id).first()
                    if p and p.product_name:
                        p_name = p.product_name
                elif s.barcode:
                    p = db.query(ProductInfo).filter(ProductInfo.barcode == s.barcode).first()
                    if p and p.product_name:
                        p_name = p.product_name

                u_name = "Anonymous"
                if s.user_id:
                    u = db.query(User).filter(User.id == s.user_id).first()
                    if u:
                        u_name = u.display_name or u.name or u.email

                recent_scans.append({
                    "id": str(s.id),
                    "product_name": p_name,
                    "barcode": s.barcode or "",
                    "user_name": u_name,
                    "verdict": s.verdict,
                    "source": s.source,
                    "detected_allergens": list(s.detected_allergens or []),
                    "language": s.language or "en",
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })

            return {
                "total_scans": total_scans,
                "safe_count": safe_cnt,
                "danger_count": danger_cnt,
                "caution_count": caution_cnt,
                "safety_rate": safety_rate,
                "unique_products": unique_products,
                "unique_users": unique_users,
                "avg_allergens_per_flagged": avg_allergens_per_flagged,
                "verdicts": {"safe": safe_cnt, "danger": danger_cnt, "caution": caution_cnt},
                "verdict_percentages": verdict_percentages,
                "sources": sources,
                "top_allergens": top_allergens,
                "daily_timeline": daily_timeline,
                "category_risk": category_risk,
                "recent_scans": recent_scans,
                "meta": {
                    "days": days,
                    "verdict": vrd_filter,
                    "source": src_filter,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                },
            }
        except Exception as e:
            print(f"Error computing admin reports from DB: {e}")
        finally:
            db.close()

    # Fallback to _SCANS_DB (empty if no real scans, never dummy data)
    filtered = list(_SCANS_DB)
    if cutoff:
        filtered = [s for s in filtered if s.get("created_at") and datetime.fromisoformat(s["created_at"].replace("Z", "+00:00")) >= cutoff]
    if src_filter:
        filtered = [s for s in filtered if s.get("source") == src_filter]

    safe_cnt = sum(1 for s in filtered if s.get("verdict") == "safe")
    danger_cnt = sum(1 for s in filtered if s.get("verdict") == "danger")
    caution_cnt = sum(1 for s in filtered if s.get("verdict") == "caution")
    total_scans = len(filtered)
    safety_rate = round((safe_cnt / total_scans * 100), 1) if total_scans > 0 else 0.0

    sources = {}
    for s in filtered:
        src = s.get("source") or "unknown"
        sources[src] = sources.get(src, 0) + 1

    return {
        "total_scans": total_scans,
        "safe_count": safe_cnt,
        "danger_count": danger_cnt,
        "caution_count": caution_cnt,
        "safety_rate": safety_rate,
        "unique_products": len(set(s.get("barcode") or s.get("product_name") for s in filtered if s.get("barcode") or s.get("product_name"))),
        "unique_users": len(set(s.get("user_name") for s in filtered if s.get("user_name"))),
        "avg_allergens_per_flagged": 0.0,
        "verdicts": {"safe": safe_cnt, "danger": danger_cnt, "caution": caution_cnt},
        "verdict_percentages": {
            "safe": round(safe_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
            "danger": round(danger_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
            "caution": round(caution_cnt / total_scans * 100, 1) if total_scans > 0 else 0.0,
        },
        "sources": sources,
        "top_allergens": [],
        "daily_timeline": [],
        "category_risk": [],
        "recent_scans": [s for s in filtered if not vrd_filter or s.get("verdict") == vrd_filter][:50],
        "meta": {
            "days": days,
            "verdict": vrd_filter,
            "source": src_filter,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def list_system_logs() -> List[Dict[str, Any]]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.system import SystemLog
            logs = db.query(SystemLog).order_by(SystemLog.created_at.desc()).all()
            if logs:
                return [
                    {
                        "id": str(l.id),
                        "level": l.level,
                        "event": l.event,
                        "message": l.message,
                        "created_at": l.created_at.isoformat() if l.created_at else None,
                    }
                    for l in logs
                ]
        except Exception:
            pass
        finally:
            db.close()

    return _SYSTEM_LOGS_DB


def create_system_log(level: str, event: str, message: str) -> Dict[str, Any]:
    log_id = str(uuid.uuid4())
    log_dict = {
        "id": log_id,
        "level": level,
        "event": event,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.system import SystemLog
            sl = SystemLog(id=uuid.UUID(log_id), level=level, event=event, message=message)
            db.add(sl)
            db.commit()
            db.refresh(sl)
            _SYSTEM_LOGS_DB.append(log_dict)
            return log_dict
        except Exception:
            db.rollback()
        finally:
            db.close()

    _SYSTEM_LOGS_DB.append(log_dict)
    return log_dict


def seed_admin_user() -> Dict[str, Any]:
    """Seed or update the default admin user with role='admin' in PostgreSQL DB."""
    admin_email = "admin@safelabelai.com"
    admin_pwd_hash = hash_password("admin123")

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User, UserProfile
            u = db.query(User).filter(func.lower(User.email) == admin_email).first()
            if not u:
                uid_obj = uuid.uuid4()
                u = User(
                    id=uid_obj,
                    name="Admin User",
                    email=admin_email,
                    password_hash=admin_pwd_hash,
                    display_name="Admin User",
                    role="admin",
                    status="active",
                )
                db.add(u)
                db.commit()
                db.refresh(u)

                prof = db.query(UserProfile).filter(UserProfile.user_id == uid_obj).first()
                if not prof:
                    p = UserProfile(id=uuid.uuid4(), user_id=uid_obj)
                    db.add(p)
                    db.commit()
            else:
                if u.role != "admin":
                    u.role = "admin"
                    db.commit()

            admin_dict = {
                "id": str(u.id),
                "email": u.email,
                "name": u.name or u.display_name or "Admin User",
                "display_name": u.display_name or u.name or "Admin User",
                "password_hash": u.password_hash,
                "role": u.role,
                "status": u.status,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "updated_at": u.updated_at.isoformat() if u.updated_at else None,
            }
            _USERS_DB[str(u.id)] = admin_dict
            return admin_dict
        except Exception as err:
            print(f"Error seeding PostgreSQL admin user: {err}")
            db.rollback()
        finally:
            db.close()

    existing = _USERS_DB.get(_DEFAULT_ADMIN_ID, _DEFAULT_ADMIN)
    existing["role"] = "admin"
    return existing


def seed_initial_scans_and_catalog(force: bool = False) -> None:
    """Seed sample products, allergens, and scans into PostgreSQL and in-memory stores."""
    global _SCANS_DB, _PRODUCTS_DB, _ALLERGENS_DB

    demo_products = [
        {
            "name": "Nutella Hazelnut Spread",
            "barcode": "3017620422003",
            "category": "Food & Beverage",
            "ingredients_text": "Sugar, palm oil, hazelnuts (13%), skimmed milk powder (8.7%), fat-reduced cocoa (7.4%), emulsifier: lecithins (soya), vanillin",
        },
        {
            "name": "Quaker Quick 1-Minute Oats",
            "barcode": "030000010204",
            "category": "Breakfast",
            "ingredients_text": "100% whole grain rolled oats. May contain traces of wheat.",
        },
        {
            "name": "Nature Valley Crunchy Granola Bars",
            "barcode": "016000275270",
            "category": "Snacks",
            "ingredients_text": "Whole Grain Oats, Sugar, Canola Oil, Rice Flour, Honey, Brown Sugar Syrup, Salt, Soy Lecithin, Peanuts, Almonds",
        },
        {
            "name": "Almond Breeze Almondmilk Vanilla",
            "barcode": "041570056214",
            "category": "Dairy Alternatives",
            "ingredients_text": "Almondmilk (Filtered Water, Almonds), Cane Sugar, Calcium Carbonate, Sea Salt, Potassium Citrate, Sunflower Lecithin, Gellan Gum",
        },
        {
            "name": "Oreo Original Sandwich Cookies",
            "barcode": "044000032029",
            "category": "Snacks",
            "ingredients_text": "Unbleached Enriched Flour (Wheat Flour, Niacin, Reduced Iron), Sugar, Palm Oil, Soybean Oil, Cocoa, High Fructose Corn Syrup, Soy Lecithin",
        },
        {
            "name": "Kinder Bueno Milk Chocolate",
            "barcode": "8000500023976",
            "category": "Confectionery",
            "ingredients_text": "Milk chocolate 31.5%, sugar, palm oil, wheat flour, hazelnuts (10.5%), skimmed milk powder, milk powder, chocolate, emulsifier lecithins (soy)",
        },
        {
            "name": "Organic Baby Spinach",
            "barcode": "078742234014",
            "category": "Fresh Produce",
            "ingredients_text": "100% Organic Baby Spinach. Washed and ready to eat.",
        },
        {
            "name": "Barilla Classic Basil Pesto",
            "barcode": "076808000450",
            "category": "Pantry & Sauces",
            "ingredients_text": "Sunflower oil, Italian basil 30%, cashews, Grana Padano cheese 4.5% (contains egg lysozyme), whey powder (milk), salt",
        },
    ]

    demo_allergens = [
        {"id": "peanut", "name": "Peanuts", "terms": ["peanut", "groundnut", "arachis"]},
        {"id": "tree_nut", "name": "Tree Nuts", "terms": ["almond", "walnut", "hazelnut", "cashew", "pistachio", "pecan", "macadamia"]},
        {"id": "milk", "name": "Milk & Dairy", "terms": ["milk", "lactose", "whey", "casein", "butter", "cheese", "cream"]},
        {"id": "egg", "name": "Eggs", "terms": ["egg", "albumin", "mayonnaise"]},
        {"id": "soy", "name": "Soybeans", "terms": ["soy", "soya", "soybean", "tofu", "lecithin"]},
        {"id": "gluten", "name": "Gluten & Wheat", "terms": ["wheat", "barley", "rye", "gluten", "flour", "oats"]},
        {"id": "sesame", "name": "Sesame", "terms": ["sesame", "tahini"]},
    ]

    # Ensure in-memory fallback has scans
    if not _SCANS_DB or force:
        _SCANS_DB = [dict(s) for s in _DEFAULT_SCANS]

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.product import ProductInfo
            from ..models.allergen import Allergen
            from ..models.scan import Scan, ScanResult
            from ..models.user import User

            # 1. Seed ProductInfo if empty or forced
            if db.query(ProductInfo).count() == 0 or force:
                for dp in demo_products:
                    existing_p = db.query(ProductInfo).filter(ProductInfo.barcode == dp["barcode"]).first()
                    if not existing_p:
                        p = ProductInfo(
                            id=uuid.uuid4(),
                            product_name=dp["name"],
                            barcode=dp["barcode"],
                            category=dp["category"],
                            ingredients_text=dp["ingredients_text"],
                            status="active",
                        )
                        db.add(p)
                db.commit()

            # 2. Seed Allergens if empty or forced
            if db.query(Allergen).count() == 0 or force:
                for da in demo_allergens:
                    existing_a = db.query(Allergen).filter(Allergen.name == da["name"]).first()
                    if not existing_a:
                        a = Allergen(
                            id=uuid.uuid4(),
                            name=da["name"],
                            category="Common Allergens",
                            terms=da["terms"],
                        )
                        db.add(a)
                db.commit()

            # 3. Seed Scans if empty or forced
            if db.query(Scan).count() == 0 or force:
                now_utc = datetime.now(timezone.utc)
                past_offsets = [
                    timedelta(hours=2),
                    timedelta(hours=5),
                    timedelta(days=1, hours=2),
                    timedelta(days=1, hours=7),
                    timedelta(days=2, hours=3),
                    timedelta(days=2, hours=8),
                    timedelta(days=3),
                    timedelta(days=4),
                ]
                for idx, ds in enumerate(_DEFAULT_SCANS):
                    u = None
                    if ds.get("user_name"):
                        u = db.query(User).filter(
                            (func.lower(User.display_name) == ds["user_name"].lower()) |
                            (func.lower(User.name) == ds["user_name"].lower())
                        ).first()
                    if not u:
                        u = db.query(User).filter(func.lower(User.email) == "admin@safelabelai.com").first()

                    p = None
                    if ds.get("barcode"):
                        p = db.query(ProductInfo).filter(ProductInfo.barcode == ds["barcode"]).first()
                    if not p and ds.get("product_name"):
                        p = db.query(ProductInfo).filter(ProductInfo.product_name == ds["product_name"]).first()

                    created_dt = now_utc - past_offsets[idx % len(past_offsets)]
                    scan_uuid = uuid.uuid4()
                    scan_obj = Scan(
                        id=scan_uuid,
                        user_id=u.id if u else None,
                        product_id=p.id if p else None,
                        barcode=ds.get("barcode"),
                        extracted_text=ds.get("extracted_text", ""),
                        language="en",
                        source=ds.get("source", "ocr"),
                        verdict=ds.get("verdict", "safe"),
                        detected_allergens=ds.get("detected_allergens", []),
                        created_at=created_dt,
                    )
                    db.add(scan_obj)
                    db.commit()

                    # Add ScanResults
                    for a_name in ds.get("detected_allergens", []):
                        a_obj = db.query(Allergen).filter(Allergen.name == a_name).first()
                        sr = ScanResult(
                            id=uuid.uuid4(),
                            scan_id=scan_uuid,
                            allergen_id=a_obj.id if a_obj else None,
                            confidence=0.95,
                            reason=f"Detected matching allergen: {a_name}",
                            created_at=created_dt,
                        )
                        db.add(sr)
                    db.commit()
        except Exception as err:
            print(f"Error seeding demo scan records: {err}")
            db.rollback()
        finally:
            db.close()