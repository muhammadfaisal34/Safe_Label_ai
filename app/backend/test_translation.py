import asyncio
from app.backend.ai.ner import extract_entities, merge_results
from app.backend.ai.translation import to_english

if __name__ == "__main__":
    text = "Zutaten: Weizenmehl, Zucker, Magermilchpulver, Haselnüsse. Kann Spuren von Erdnüssen enthalten."
    tr = asyncio.run(to_english(text))
    print(tr)
    print(merge_results(extract_entities(tr["text"]), extract_entities(tr["original"])))