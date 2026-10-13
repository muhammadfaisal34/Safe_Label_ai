import sys
from pathlib import Path
_root = Path(__file__).resolve().parents[2]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from app.backend.ai.ner import extract_entities, get_nlp

if __name__ == "__main__":
    print(get_nlp().pipe_names)
    text = """INGREDIENTS: Wheat flour, sugar, cocoa butter, whey powder,
emulsifier (E 322, E-471), colour E160a. May contain peanuts and hazelnuts."""
    print(extract_entities(text))