import asyncio
import sys
from pathlib import Path

_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from app.backend.ai.ner.service import analyze_text
from app.backend.app.core.terminal_timer import log_banner, log_pipeline_finish


def test_ner_timing():
    sample_text = (
        "INGREDIENTS: Wheat flour (contains gluten), Sugar, Cocoa mass, Whole milk powder, "
        "Emulsifier: soya lecithin (E322), Flavouring, Peanuts, Hazelnuts."
    )
    user_allergens = ["peanut", "milk", "gluten"]

    log_banner("Live Test Scan", "Testing real-time terminal output & timers")
    res = analyze_text(sample_text, profile=user_allergens)
    print("\nResult Verdict:", res["verdict"].upper())
    print("Detected Findings:", [f["ingredient"] for f in res["findings"]])
    print("User Allergens Matched:", [f["allergen"] for f in res["mine"]])


if __name__ == "__main__":
    test_ner_timing()
