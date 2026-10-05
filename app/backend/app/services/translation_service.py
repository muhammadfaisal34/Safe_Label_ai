async def translate(text: str, source_lang: str, target_lang: str = "en") -> str:
    if source_lang == target_lang:
        return text
    return text
