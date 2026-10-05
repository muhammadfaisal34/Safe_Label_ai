from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1)
    lang: str = "en"
    profile: list[str] = []


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
