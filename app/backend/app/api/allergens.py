from fastapi import APIRouter

from ..services.allergen_service import list_allergens

router = APIRouter(prefix="/allergens", tags=["allergens"])


@router.get("")
def allergens() -> list[dict[str, object]]:
    return list_allergens()
