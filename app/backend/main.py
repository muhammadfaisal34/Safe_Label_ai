import sys
from pathlib import Path
from food_api import products as food_products

# Ensure workspace root is in sys.path when running uvicorn from app/backend directory
_workspace_root = Path(__file__).resolve().parents[2]
if str(_workspace_root) not in sys.path:
    sys.path.insert(0, str(_workspace_root))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.backend.app.api import admin, allergens, auth, products, scan, scans, users
    from app.backend.app.core.config import settings
    from app.backend.app.core.database import seed_admin_user
except (ModuleNotFoundError, ImportError):
    from app.api import admin, allergens, auth, products, scan, scans, users
    from app.core.config import settings
    from app.core.database import seed_admin_user



@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        seed_admin_user()
    except Exception as e:
        print(f"Warning seeding admin user: {e}")
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)



app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(scans.router)
app.include_router(scan.router)
app.include_router(products.router)
app.include_router(allergens.router)
app.add_api_route("/ocr", scans.ocr, methods=["POST"], tags=["scans"])
app.add_api_route("/analyze", scans.analyze, methods=["POST"], tags=["scans"])



@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
