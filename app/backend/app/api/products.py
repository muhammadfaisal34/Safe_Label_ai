from fastapi import APIRouter

from ..services.barcode_service import lookup_barcode

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/{barcode}")
async def product(barcode: str) -> dict | None:
    return await lookup_barcode(barcode)
