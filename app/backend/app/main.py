from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, allergens, auth, products, scans, users
from .core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)
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
app.include_router(products.router)
app.include_router(allergens.router)
app.add_api_route("/ocr", scans.ocr, methods=["POST"], tags=["scans"])
app.add_api_route("/analyze", scans.analyze, methods=["POST"], tags=["scans"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
