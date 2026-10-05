from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = "User"


class TokenResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    two_factor_required: bool = False
    email: str | None = None
    message: str | None = None


class Verify2FARequest(BaseModel):
    email: str
    code: str


class Resend2FARequest(BaseModel):
    email: str

