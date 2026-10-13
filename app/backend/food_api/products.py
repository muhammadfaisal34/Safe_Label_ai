from fastapi import APIRouter, HTTPException, Query

from food_api.off_service import OFFError, analyze_barcode

router = APIRouter(prefix="/food", tags=["food-lookup"])


@router.get("/barcode/{barcode}")
async def scan_barcode(
    barcode: str,
    allergens: list[str] = Query(default=[], description="e.g. ?allergens=milk&allergens=nuts"),
):
    try:
        return await analyze_barcode(barcode, allergens)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except OFFError as e:
        raise HTTPException(status_code=502, detail=str(e))