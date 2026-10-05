from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(LoginRequest):
    pass


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
