import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, func
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
            users = db.query(User).order_by(User.created_at.desc()).all()
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

    return list(_USERS_DB.values())


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
            if scans:
                res = []
                for s in scans:
                    p_name = "Scanned Label"
                    if s.product_id:
                        p = db.query(ProductInfo).filter(ProductInfo.id == s.product_id).first()
                        if p:
                            p_name = p.product_name
                    u_name = "Anonymous"
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
                        "created_at": s.created_at.isoformat() if s.created_at else None,
                        "detected_allergens": list(s.detected_allergens or []),
                    })
                return res
        except Exception:
            pass
        finally:
            db.close()

    return _SCANS_DB


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


def admin_reports() -> Dict[str, Any]:
    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.scan import Scan
            total_scans = db.query(func.count(Scan.id)).scalar() or 0
            safe_cnt = db.query(func.count(Scan.id)).filter(Scan.verdict == "safe").scalar() or 0
            danger_cnt = db.query(func.count(Scan.id)).filter(Scan.verdict == "danger").scalar() or 0
            caution_cnt = db.query(func.count(Scan.id)).filter(Scan.verdict == "caution").scalar() or 0
            
            safety_rate = round((safe_cnt / total_scans * 100), 1) if total_scans > 0 else 100.0

            return {
                "total_scans": total_scans,
                "safety_rate": safety_rate,
                "danger_count": danger_cnt,
                "caution_count": caution_cnt,
                "verdicts": {"safe": safe_cnt, "danger": danger_cnt, "caution": caution_cnt},
                "sources": {"ocr": total_scans, "barcode": 0},
            }
        except Exception:
            pass
        finally:
            db.close()

    return {
        "total_scans": len(_SCANS_DB),
        "safety_rate": 100.0,
        "danger_count": 0,
        "caution_count": 0,
        "verdicts": {"safe": len(_SCANS_DB), "danger": 0, "caution": 0},
        "sources": {"ocr": len(_SCANS_DB)},
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