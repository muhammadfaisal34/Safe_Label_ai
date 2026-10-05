from dataclasses import dataclass


@dataclass
class Allergen:
    slug: str
    name: str
    terms: list[str]
