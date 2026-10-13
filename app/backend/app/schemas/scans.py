from pydantic import BaseModel, Field


class OcrLine(BaseModel):
    text: str
    confidence: float


class OcrResponse(BaseModel):
    text: str
    lang: str
    lines: list[OcrLine] = []
    avg_confidence: float
    low_confidence: bool
    ingredients: list[str] = []
    raw_text: str | None = None


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1)
    lang: str = "en"
    profile: list[str] = []
    product_name: str | None = None
    barcode: str | None = None
    source: str | None = "ocr"
    user_id: str | None = None
    user_email: str | None = None


class Finding(BaseModel):
    ingredient: str
    allergen: str
    trace: bool
    confidence: float
    reason: str


class Entity(BaseModel):
    text: str
    label: str
    allergen: str | None = None
    start: int
    end: int


class AnalyzeResponse(BaseModel):
    ingredients: list[str]
    findings: list[Finding]
    mine: list[Finding]
    verdict: str
    lang: str
    entities: list[Entity] = []
    ingredients_text: str | None = None
    scan_id: str | None = None


