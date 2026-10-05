from fastapi import APIRouter, Depends

from ..core.security import require_bearer_token

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def current_user(token: dict = Depends(require_bearer_token)) -> dict[str, str]:
    return {"id": token["sub"], "email": token["email"]}
