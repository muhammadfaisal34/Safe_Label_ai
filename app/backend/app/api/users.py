from fastapi import APIRouter, Depends, HTTPException, status

from ..core.database import find_user_by_email, find_user_by_id
from ..core.security import require_bearer_token

router = APIRouter(prefix="/users", tags=["users"])


def _extract_name_from_email(email: str | None) -> str:
    if not email:
        return "User"
    local = email.split("@")[0]
    cleaned = "".join([c if c.isalpha() else " " for c in local]).strip()
    words = [w.capitalize() for w in cleaned.split() if w]
    return " ".join(words) if words else local.capitalize()


@router.get("/me")
def current_user(token: dict = Depends(require_bearer_token)) -> dict:
    user_id = token.get("sub")
    email = token.get("email")

    user = None
    if user_id:
        user = find_user_by_id(user_id)
    if not user and email:
        user = find_user_by_email(email)

    if user:
        raw_name = user.get("display_name") or user.get("name")
        display_name = raw_name if (raw_name and raw_name.strip() and raw_name.strip().lower() != "user") else _extract_name_from_email(user.get("email"))
        return {
            "id": str(user["id"]),
            "email": user["email"],
            "display_name": display_name,
            "role": user.get("role", "customer"),
            "status": user.get("status", "active"),
        }

    return {"id": user_id, "email": email, "display_name": _extract_name_from_email(email), "role": "customer", "status": "active"}


@router.patch("/me")
def update_current_user(body: dict, token: dict = Depends(require_bearer_token)) -> dict:
    user_id = token.get("sub")
    email = token.get("email")
    new_name = (body.get("display_name") or body.get("name") or "").strip()
    if not new_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")

    import uuid
    from ..core.database import SessionLocal, _USERS_DB

    if SessionLocal:
        db = SessionLocal()
        try:
            from ..models.user import User
            u = None
            if user_id:
                try:
                    u = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
                except Exception:
                    pass
            if not u and email:
                u = db.query(User).filter(User.email == email.lower().strip()).first()
            if u:
                u.name = new_name
                u.display_name = new_name
                db.commit()
                db.refresh(u)
                return {
                    "id": str(u.id),
                    "email": u.email,
                    "display_name": u.display_name,
                    "role": u.role,
                    "status": u.status,
                }
        except Exception:
            db.rollback()
        finally:
            db.close()

    if user_id and user_id in _USERS_DB:
        _USERS_DB[user_id]["display_name"] = new_name
        _USERS_DB[user_id]["name"] = new_name

    return {"id": user_id, "email": email, "display_name": new_name, "role": "customer", "status": "active"}

