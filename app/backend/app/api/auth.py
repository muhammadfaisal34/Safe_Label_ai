import re
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from psycopg.errors import UniqueViolation

from ..core.database import create_user, find_user_by_email, generate_2fa_code, verify_2fa_code
from ..core.security import create_access_token, hash_password, verify_password
from ..schemas.auth import LoginRequest, RegisterRequest, Resend2FARequest, TokenResponse, Verify2FARequest
from ..services.email_service import send_2fa_email

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
    
    # Check if user needs 2FA verification
    if user.get("status") == "pending_2fa":
        code = generate_2fa_code(user["email"])
        email_res = send_2fa_email(user["email"], code)
        return TokenResponse(
            access_token=None,
            two_factor_required=True,
            email=user["email"],
            message=email_res.get("message") or "2FA verification required. A 6-digit code has been sent to your email.",
        )

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
            status="pending_2fa",
        )
    except UniqueViolation as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from error
    
    # Generate 2FA code and send via Resend email
    code = generate_2fa_code(user["email"])
    email_res = send_2fa_email(user["email"], code)

    return TokenResponse(
        access_token=None,
        two_factor_required=True,
        email=user["email"],
        message=email_res.get("message") or "Account created! A 6-digit verification code has been sent to your email.",
    )


@router.post("/verify-2fa", response_model=TokenResponse)
def verify_2fa(request: Verify2FARequest) -> TokenResponse:
    email = request.email.lower().strip()
    user = find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    is_valid = verify_2fa_code(email, request.code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired 2FA verification code. Please check your email or request a new code.",
        )

    # 2FA verified successfully, issue JWT access token
    access_token = create_access_token(str(user["id"]), user["email"])
    return TokenResponse(
        access_token=access_token,
        two_factor_required=False,
        email=user["email"],
        message="Verification successful!",
    )


@router.post("/resend-2fa")
def resend_2fa(request: Resend2FARequest) -> dict:
    email = request.email.lower().strip()
    user = find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    code = generate_2fa_code(email)
    email_res = send_2fa_email(email, code)
    return {"message": email_res.get("message") or "A new 6-digit 2FA verification code has been sent."}


