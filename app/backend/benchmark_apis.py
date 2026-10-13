import asyncio
import os
import sys
import time
import uuid
from pathlib import Path

# Setup sys.path
workspace_root = Path(__file__).resolve().parents[2]
backend_dir = workspace_root / "app" / "backend"
for p in [str(workspace_root), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from app.backend.main import app
from app.backend.ai.ocr.service import extract_text as ocr_service_func
from app.backend.ai.ner.service import analyze_text as ner_analyze_func, extract_entities as ner_extract_func
from app.backend.ai.translation.service import to_english as translation_service_func
from app.backend.food_api.off_service import analyze_barcode as off_analyze_barcode
from app.backend.app.services.barcode_service import lookup_barcode as barcode_lookup_service

client = TestClient(app)

# Load test image
image_path = workspace_root / "label.jpg"
if not image_path.exists():
    image_path = backend_dir / "label.jpg"

image_bytes = image_path.read_bytes() if image_path.exists() else b""

print(f"Loaded test image: {len(image_bytes)} bytes from {image_path}")

def benchmark(name, func, runs=3):
    """Run function multiple times and return (avg_ms, min_ms, max_ms, first_ms, result)"""
    latencies = []
    first_ms = None
    result = None
    for i in range(runs):
        t0 = time.perf_counter()
        res = func()
        t1 = time.perf_counter()
        elapsed_ms = (t1 - t0) * 1000.0
        latencies.append(elapsed_ms)
        if i == 0:
            first_ms = elapsed_ms
            result = res
    avg_ms = sum(latencies) / len(latencies)
    min_ms = min(latencies)
    max_ms = max(latencies)
    return {
        "name": name,
        "avg_ms": round(avg_ms, 2),
        "min_ms": round(min_ms, 2),
        "max_ms": round(max_ms, 2),
        "first_ms": round(first_ms, 2),
        "result": result
    }

results = []

# 1. Health
print("\n--- 1. Health Check ---")
r = benchmark("GET /health", lambda: client.get("/health"), runs=3)
results.append(r)
print(f"GET /health: {r['avg_ms']}ms (status {r['result'].status_code})")

# 2. Allergens
print("\n--- 2. Allergens API ---")
r = benchmark("GET /allergens", lambda: client.get("/allergens"), runs=3)
results.append(r)
print(f"GET /allergens: {r['avg_ms']}ms (items: {len(r['result'].json())})")

# 3. Barcode Lookup (Backend route: /products/{barcode})
print("\n--- 3. Barcode API ---")
# Nutella barcode: 3017620422003 or 5449000000996 (Coke)
test_barcode = "3017620422003"
r = benchmark(f"GET /products/{test_barcode}", lambda: client.get(f"/products/{test_barcode}"), runs=3)
results.append(r)
print(f"GET /products/{test_barcode}: {r['avg_ms']}ms (status: {r['result'].status_code})")

# Direct barcode service
r_bar_direct = benchmark("Service: lookup_barcode() (OpenFoodFacts)", lambda: asyncio.run(barcode_lookup_service(test_barcode)), runs=2)
results.append(r_bar_direct)
print(f"Direct barcode lookup: {r_bar_direct['avg_ms']}ms")

# Food API off_service barcode
try:
    r_food = benchmark("Service: food_api.analyze_barcode()", lambda: asyncio.run(off_analyze_barcode(test_barcode, ["milk", "nuts"])), runs=2)
    results.append(r_food)
    print(f"Food API off_service: {r_food['avg_ms']}ms")
except Exception as e:
    print(f"Food API off_service error: {e}")

# 4. OCR APIs
print("\n--- 4. OCR APIs ---")
files_payload = {"file": ("label.jpg", image_bytes, "image/jpeg")}
r_ocr_alias = benchmark("POST /ocr (Scans OCR Alias)", lambda: client.post("/ocr", files={"file": ("label.jpg", image_bytes, "image/jpeg")}), runs=2)
results.append(r_ocr_alias)
print(f"POST /ocr: {r_ocr_alias['avg_ms']}ms (status: {r_ocr_alias['result'].status_code})")

r_scans_ocr = benchmark("POST /scans/ocr", lambda: client.post("/scans/ocr", files={"file": ("label.jpg", image_bytes, "image/jpeg")}), runs=2)
results.append(r_scans_ocr)
print(f"POST /scans/ocr: {r_scans_ocr['avg_ms']}ms (status: {r_scans_ocr['result'].status_code})")

# Direct OCR AI service
r_ocr_direct = benchmark("Service: ai.ocr.extract_text()", lambda: asyncio.run(ocr_service_func(image_bytes, "en")), runs=2)
results.append(r_ocr_direct)
print(f"Direct ai.ocr: {r_ocr_direct['avg_ms']}ms")

# 5. NER & Allergen Analysis APIs
print("\n--- 5. NER & Allergen Analysis APIs ---")
ner_payload = {
    "text": "INGREDIENTS: Wheat flour, sugar, whole milk powder, peanuts, cocoa butter, soy lecithin, hazelnuts. May contain eggs.",
    "profile": ["peanut", "milk", "egg"]
}
r_analyze_alias = benchmark("POST /analyze (NER Analysis Alias)", lambda: client.post("/analyze", json=ner_payload), runs=3)
results.append(r_analyze_alias)
print(f"POST /analyze: {r_analyze_alias['avg_ms']}ms (verdict: {r_analyze_alias['result'].json().get('verdict')})")

r_scans_analyze = benchmark("POST /scans/analyze", lambda: client.post("/scans/analyze", json=ner_payload), runs=3)
results.append(r_scans_analyze)
print(f"POST /scans/analyze: {r_scans_analyze['avg_ms']}ms (verdict: {r_scans_analyze['result'].json().get('verdict')})")

# Direct NER service
r_ner_direct = benchmark("Service: ai.ner.analyze_text()", lambda: ner_analyze_func(ner_payload["text"], ner_payload["profile"]), runs=3)
results.append(r_ner_direct)
print(f"Direct ai.ner analyze_text: {r_ner_direct['avg_ms']}ms")

r_ner_extract = benchmark("Service: ai.ner.extract_entities()", lambda: ner_extract_func(ner_payload["text"]), runs=3)
results.append(r_ner_extract)
print(f"Direct ai.ner extract_entities: {r_ner_extract['avg_ms']}ms")

# 6. Translation Service
print("\n--- 6. Translation Service ---")
german_text = "Zutaten: Weizenmehl, Zucker, Magermilchpulver, Haselnüsse. Kann Spuren von Erdnüssen enthalten."
r_trans = benchmark("Service: ai.translation.to_english() (German)", lambda: asyncio.run(translation_service_func(german_text)), runs=2)
results.append(r_trans)
print(f"Direct ai.translation: {r_trans['avg_ms']}ms (translated: {r_trans['result'].get('translated')}, error: {r_trans['result'].get('error')})")

# 7. Full Combined Scan Pipeline (POST /scan: OCR -> Translation -> NER -> Save)
print("\n--- 7. Full Combined Scan API (/scan) ---")
scan_form_files = {"image": ("label.jpg", image_bytes, "image/jpeg")}
scan_form_data = {"lang": "en"}
r_full_scan = benchmark("POST /scan (OCR + Translation + NER + Save)", lambda: client.post("/scan", files={"image": ("label.jpg", image_bytes, "image/jpeg")}, data=scan_form_data), runs=2)
results.append(r_full_scan)
print(f"POST /scan: {r_full_scan['avg_ms']}ms (status: {r_full_scan['result'].status_code})")

# 8. Direct Save Scan (POST /scans)
print("\n--- 8. Save Scan API (/scans) ---")
save_scan_payload = {
    "product_name": "Test Chocolate Bar",
    "barcode": "3017620422003",
    "extracted_text": "Wheat, Milk, Sugar",
    "language": "en",
    "source": "ocr",
    "verdict": "danger",
    "detected_allergens": ["wheat", "milk"]
}
r_save_scan = benchmark("POST /scans (Save Scan)", lambda: client.post("/scans", json=save_scan_payload), runs=3)
results.append(r_save_scan)
print(f"POST /scans: {r_save_scan['avg_ms']}ms (status: {r_save_scan['result'].status_code})")

# 9. Auth APIs
print("\n--- 9. Auth APIs ---")
test_email = f"benchmark_{uuid.uuid4().hex[:6]}@gmail.com"
test_password = "Password123!"

r_register = benchmark("POST /auth/register", lambda: client.post("/auth/register", json={"email": test_email, "password": test_password, "display_name": "Benchmark User"}), runs=1)
results.append(r_register)
print(f"POST /auth/register: {r_register['avg_ms']}ms (status: {r_register['result'].status_code})")

from app.backend.app.core.database import _2FA_CODES
two_fa_code = _2FA_CODES.get(test_email, {}).get("code", "000000")

r_verify_2fa = benchmark("POST /auth/verify-2fa", lambda: client.post("/auth/verify-2fa", json={"email": test_email, "code": two_fa_code}), runs=1)
results.append(r_verify_2fa)
print(f"POST /auth/verify-2fa: {r_verify_2fa['avg_ms']}ms (status: {r_verify_2fa['result'].status_code})")

r_resend_2fa = benchmark("POST /auth/resend-2fa", lambda: client.post("/auth/resend-2fa", json={"email": test_email}), runs=1)
results.append(r_resend_2fa)
print(f"POST /auth/resend-2fa: {r_resend_2fa['avg_ms']}ms (status: {r_resend_2fa['result'].status_code})")

r_login = benchmark("POST /auth/login (Admin Login)", lambda: client.post("/auth/login", json={"email": "admin@safelabelai.com", "password": "admin123"}), runs=3)
results.append(r_login)
token = r_login['result'].json().get("access_token")
print(f"POST /auth/login: {r_login['avg_ms']}ms (status: {r_login['result'].status_code})")

admin_headers = {"Authorization": f"Bearer {token}"}

# 10. Users API
print("\n--- 10. Users API ---")
r_users_me = benchmark("GET /users/me", lambda: client.get("/users/me", headers=admin_headers), runs=3)
results.append(r_users_me)
print(f"GET /users/me: {r_users_me['avg_ms']}ms (email: {r_users_me['result'].json().get('email')})")

# 11. Admin APIs
print("\n--- 11. Admin APIs ---")
admin_endpoints = [
    ("GET /admin/stats", lambda: client.get("/admin/stats", headers=admin_headers)),
    ("GET /admin/users", lambda: client.get("/admin/users", headers=admin_headers)),
    ("GET /admin/products", lambda: client.get("/admin/products", headers=admin_headers)),
    ("GET /admin/scans", lambda: client.get("/admin/scans", headers=admin_headers)),
    ("GET /admin/allergens", lambda: client.get("/admin/allergens", headers=admin_headers)),
    ("GET /admin/reports", lambda: client.get("/admin/reports", headers=admin_headers)),
    ("GET /admin/logs", lambda: client.get("/admin/logs", headers=admin_headers)),
    ("GET /admin/settings", lambda: client.get("/admin/settings", headers=admin_headers)),
]

for name, fn in admin_endpoints:
    r_adm = benchmark(name, fn, runs=3)
    results.append(r_adm)
    print(f"{name}: {r_adm['avg_ms']}ms (status: {r_adm['result'].status_code})")

print("\n" + "="*80)
print(f"{'ENDPOINT / COMPONENT':<45} | {'AVG TIME':<10} | {'MIN TIME':<10} | {'MAX TIME':<10} | {'FIRST/COLD':<10}")
print("="*80)
for r in results:
    print(f"{r['name']:<45} | {r['avg_ms']:>7.2f} ms | {r['min_ms']:>7.2f} ms | {r['max_ms']:>7.2f} ms | {r['first_ms']:>7.2f} ms")
print("="*80)
