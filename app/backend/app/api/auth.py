from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from ..core.database import create_user, find_user_by_email
from ..core.security import create_access_token, hash_password, verify_password
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest) -> TokenResponse:
    user = find_user_by_email(request.email.lower().strip())
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(user["id"]), user["email"]))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> TokenResponse:
    email = request.email.lower().strip()
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    try:
        user = create_user(str(uuid4()), email, hash_password(request.password))
    except UniqueViolation as error:
        raise HTTPException(status_code=409, detail="Email is already registered") from error
    return TokenResponse(access_token=create_access_token(str(user["id"]), user["email"]))
