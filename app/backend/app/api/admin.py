import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.database import (
    admin_reports,
    admin_stats,
    clear_admin_scans,
    create_admin_product,
    create_or_update_allergen,
    create_system_log,
    create_user,
    delete_admin_product,
    delete_admin_scan,
    delete_allergen,
    delete_user,
    list_admin_allergens,
    list_admin_products,
    list_admin_scans,
    list_admin_users,
    list_system_logs,
    record_scan,
    seed_initial_scans_and_catalog,
)
from ..core.security import hash_password, require_bearer_token

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_bearer_token)])


class CreateUserRequest(BaseModel):
    email: str
    password: str
    display_name: str = "User"
    role: str = "user"
    status: str = "active"


class CreateProductRequest(BaseModel):
    name: str
    barcode: str | None = None
    category: str = "Food & Beverage"
    ingredients_text: str = ""
    status: str = "active"


class CreateAllergenRequest(BaseModel):
    id: str
    name: str
    terms: list[str] = []


class CreateScanRequest(BaseModel):
    product_name: str | None = None
    barcode: str | None = None
    extracted_text: str = ""
    language: str = "en"
    source: str = "ocr"
    verdict: str = "safe"
    detected_allergens: list[str] = []
    user_name: str | None = None
    user_email: str | None = None


class LogEntryRequest(BaseModel):
    level: str = "INFO"
    event: str
    message: str


class SettingsUpdateRequest(BaseModel):
    ai_threshold: float = 0.75
    enable_ocr_cache: bool = True
    alert_on_traces: bool = True
    notifications_enabled: bool = True


# In-memory settings state for runtime adjustments
SYSTEM_SETTINGS = {
    "ai_threshold": 0.75,
    "enable_ocr_cache": True,
    "alert_on_traces": True,
    "notifications_enabled": True,
    "maintenance_mode": False,
    "supported_languages": ["en", "de", "fr", "es", "ur"],
}


@router.get("/stats")
def stats() -> dict[str, int]:
    return admin_stats()


@router.get("/users")
def get_users() -> list[dict]:
    return list_admin_users()


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_new_user(request: CreateUserRequest) -> dict:
    user_id = str(uuid.uuid4())
    pwd_hash = hash_password(request.password)
    user = create_user(
        user_id=user_id,
        email=request.email.lower().strip(),
        password_hash=pwd_hash,
        display_name=request.display_name,
        role=request.role,
        status=request.status,
    )
    create_system_log("INFO", "USER_CREATED", f"User {request.email} created by admin.")
    return user


@router.delete("/users/{user_id}")
def remove_user(user_id: str) -> dict[str, str]:
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    create_system_log("INFO", "USER_DELETED", f"User {user_id} deleted by admin.")
    return {"message": "User deleted successfully"}


@router.get("/products")
def get_products() -> list[dict]:
    return list_admin_products()


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(request: CreateProductRequest) -> dict:
    product = create_admin_product(
        name=request.name.strip(),
        barcode=request.barcode.strip() if request.barcode else None,
        category=request.category.strip(),
        ingredients_text=request.ingredients_text.strip(),
        status=request.status,
    )
    create_system_log("INFO", "PRODUCT_CREATED", f"Product '{request.name}' added to database.")
    return product


@router.delete("/products/{product_id}")
def remove_product(product_id: str) -> dict[str, str]:
    success = delete_admin_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    create_system_log("INFO", "PRODUCT_DELETED", f"Product {product_id} deleted.")
    return {"message": "Product deleted successfully"}


@router.get("/scans")
def get_scans() -> list[dict]:
    return list_admin_scans()


@router.post("/scans", status_code=status.HTTP_201_CREATED)
def create_scan(request: CreateScanRequest) -> dict:
    return record_scan(
        product_name=request.product_name,
        barcode=request.barcode,
        extracted_text=request.extracted_text,
        language=request.language,
        source=request.source,
        verdict=request.verdict,
        detected_allergens=request.detected_allergens,
        user_email=request.user_email,
    )


@router.delete("/scans/{scan_id}")
def remove_scan(scan_id: str) -> dict[str, str]:
    success = delete_admin_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"message": "Scan record deleted successfully"}


@router.delete("/scans")
def remove_all_scans() -> dict[str, str]:
    clear_admin_scans()
    return {"message": "All scan records cleared successfully"}


@router.post("/scans/seed")
def seed_scans() -> list[dict]:
    seed_initial_scans_and_catalog(force=True)
    return list_admin_scans()


@router.get("/allergens")
def get_allergens() -> list[dict]:
    return list_admin_allergens()


@router.post("/allergens", status_code=status.HTTP_201_CREATED)
def create_allergen(request: CreateAllergenRequest) -> dict:
    allergen = create_or_update_allergen(
        allergen_id=request.id.strip().lower(),
        name=request.name.strip(),
        terms=[t.strip().lower() for t in request.terms if t.strip()],
    )
    create_system_log("INFO", "ALLERGEN_UPDATED", f"Allergen '{request.name}' saved.")
    return allergen


@router.delete("/allergens/{allergen_id}")
def remove_allergen(allergen_id: str) -> dict[str, str]:
    success = delete_allergen(allergen_id)
    if not success:
        raise HTTPException(status_code=404, detail="Allergen not found")
    create_system_log("INFO", "ALLERGEN_DELETED", f"Allergen {allergen_id} deleted.")
    return {"message": "Allergen deleted successfully"}


@router.get("/reports")
def get_reports(
    days: int | None = None,
    verdict: str | None = None,
    source: str | None = None,
) -> dict:
    return admin_reports(days=days, verdict=verdict, source=source)


@router.get("/logs")
def get_logs() -> list[dict]:
    return list_system_logs()


@router.post("/logs", status_code=status.HTTP_201_CREATED)
def add_log(request: LogEntryRequest) -> dict:
    return create_system_log(request.level, request.event, request.message)


@router.get("/settings")
def get_settings() -> dict:
    return SYSTEM_SETTINGS


@router.post("/settings")
def update_settings(request: SettingsUpdateRequest) -> dict:
    SYSTEM_SETTINGS.update(request.model_dump())
    create_system_log("INFO", "SETTINGS_UPDATED", "Admin updated platform settings.")
    return SYSTEM_SETTINGS