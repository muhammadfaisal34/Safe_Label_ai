from dataclasses import dataclass


@dataclass
class Scan:
    user_email: str
    text: str
    verdict: str
