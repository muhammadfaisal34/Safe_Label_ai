import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from ..core.database import create_user, find_user_by_email
from ..core.security import create_access_token, hash_password, verify_password
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
ALLOWED_EMAIL_DOMAINS = (
    "@gmail.com",
    "@yahoo.com",
    "@outlook.com",
    "@hotmail.com",
    "@icloud.com",
    "@live.com",
    "@proton.me",
    "@protonmail.com",
)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest) -> TokenResponse:
    user = find_user_by_email(request.email.lower().strip())
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(user["id"]), user["email"]))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> TokenResponse:
    email = request.email.lower().strip()
    
    # 1. Email format and domain validation (e.g., @gmail.com or @yahoo.com)
    if not EMAIL_REGEX.match(email) or not any(email.endswith(domain) for domain in ALLOWED_EMAIL_DOMAINS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address ending with a recognized domain (e.g. @gmail.com or @yahoo.com)."
        )

    # 2. Password strength validation (min 8 chars, letter, number, and special character)
    password = request.password
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[a-zA-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?~`]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character (e.g. !@#$%^&*)."
        )

    try:
        user = create_user(
            user_id=str(uuid4()),
            email=email,
            password_hash=hash_password(password),
            display_name=request.display_name or "User",
        )
    except UniqueViolation as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from error
    return TokenResponse(access_token=create_access_token(str(user["id"]), user["email"]))

