from fastapi import APIRouter, Depends, HTTPException, status

from ..core.database import find_user_by_email, find_user_by_id
from ..core.security import require_bearer_token

router = APIRouter(prefix="/users", tags=["users"])


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
        return {
            "id": str(user["id"]),
            "email": user["email"],
            "display_name": user.get("display_name") or user.get("name") or "User",
            "role": user.get("role", "customer"),
            "status": user.get("status", "active"),
        }

    return {"id": user_id, "email": email, "display_name": "User", "role": "customer", "status": "active"}

