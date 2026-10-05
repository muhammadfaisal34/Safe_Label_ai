from dataclasses import dataclass


@dataclass
class Product:
    name: str
    barcode: str | None = None
    ingredients_text: str = ""
