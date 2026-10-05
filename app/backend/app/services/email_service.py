import os
import logging
import httpx
from ..core.config import settings

logger = logging.getLogger("uvicorn.error")


def get_resend_api_key() -> str:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    if not key:
        key = settings.resend_api_key.strip()
    # Try reading directly from .env file if available
    if not key:
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("RESEND_API_KEY="):
                        key = line.split("=", 1)[1].strip()
                        break
    return key


def send_2fa_email(to_email: str, code: str) -> dict:
    """
    Send a 6-digit 2FA verification email using Resend API.
    Returns a dict with sent status, detail message, and dev_code fallback.
    """
    api_key = get_resend_api_key()
    from_email = os.environ.get("RESEND_FROM_EMAIL", "").strip() or settings.resend_from_email.strip()

    subject = "Your SafeLabel AI 2FA Verification Code"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>SafeLabel AI 2FA Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background-color: #0284c7; border-radius: 30px; margin-bottom: 12px;">
                    <span style="color: #ffffff; font-size: 28px; font-weight: bold;">✓</span>
                </div>
                <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">SafeLabel AI</h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Scan. Detect. Stay safe.</p>
            </div>
            
            <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                Thank you for creating an account with SafeLabel AI. Please use the 6-digit security code below to complete your sign-up verification:
            </p>
            
            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: monospace, Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">{code}</span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.4;">
                This 2FA verification code will expire in <strong>10 minutes</strong>. If you did not create a SafeLabel AI account, please disregard this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                SafeLabel AI • Allergen Detection & Food Label Safety
            </p>
        </div>
    </body>
    </html>
    """

    if not api_key:
        logger.info(f"[DEV MODE - RESEND API KEY NOT SET IN .ENV] 2FA Code for {to_email}: {code}")
        print(f"\n=======================================================")
        print(f"  [SAFE-LABEL 2FA VERIFICATION CODE]")
        print(f"  To: {to_email}")
        print(f"  Code: {code}")
        print(f"=======================================================\n")
        return {
            "sent": False,
            "reason": "RESEND_API_KEY not set in .env",
            "message": f"Verification code generated. (Dev Code: {code})",
            "dev_code": code,
        }

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            },
            timeout=10.0,
        )
        if response.status_code in (200, 201):
            logger.info(f"Resend API email successfully sent to {to_email}")
            return {
                "sent": True,
                "message": f"A 6-digit verification code has been sent to {to_email}",
                "dev_code": None,
            }
        else:
            logger.error(f"Resend API error status {response.status_code}: {response.text}")
            print(f"\n[RESEND API ERROR {response.status_code}]: {response.text}\n")
            reason_str = f"Resend API status {response.status_code}"
            if response.status_code == 403 and "only send testing emails" in response.text:
                print("==========================================================================")
                print("[RESEND TESTING LIMITATION]: 'onboarding@resend.dev' can only send emails to")
                print("the registered Resend account address (deve.devhub@gmail.com).")
                print(f"For other emails (e.g. {to_email}), use Dev Code: {code}")
                print("==========================================================================\n")
                reason_str = "Resend test domain restricted to deve.devhub@gmail.com"

            return {
                "sent": False,
                "reason": reason_str,
                "message": f"Verification code generated. (Dev Code: {code})",
                "dev_code": code,
            }
    except Exception as err:
        logger.error(f"Exception sending Resend 2FA email: {err}")
        return {
            "sent": False,
            "reason": str(err),
            "message": f"Verification code generated. (Dev Code: {code})",
            "dev_code": code,
        }

