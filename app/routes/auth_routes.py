from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_verification_email
import logging

logger = logging.getLogger("emolit.auth")
router = APIRouter(tags=["auth"])

# 1. We define the payload expected from the frontend/mobile app
class GenerateAndSendVerificationRequest(BaseModel):
    email: EmailStr
    continue_url: str = ""

# 2. The core endpoint to generate and send the link
@router.post("/auth/generate-and-send-verification")
@router.post("/api/auth/generate-and-send-verification")
async def generate_and_send_verification(payload: GenerateAndSendVerificationRequest):
    """
    Uses firebase-admin to generate an email verification action link,
    then sends it via our beautiful branded SMTP email.
    """
    try:
        from firebase_admin import auth as firebase_auth

        # Step A: Setup redirection (where the user goes after clicking the link)
        action_code_settings = None
        if payload.continue_url:
            from firebase_admin.auth import ActionCodeSettings as AdminActionCodeSettings
            action_code_settings = AdminActionCodeSettings(
                url=payload.continue_url,
                handle_code_in_app=False,
            )

        # Step B: Have Firebase generate the secure verification link for this specific email
        verification_link = firebase_auth.generate_email_verification_link(
            payload.email,
            action_code_settings=action_code_settings,
        )

        # Step C: Send our beautiful branded email template with the generated link
        success = send_verification_email(
            user_email=payload.email,
            verification_link=verification_link,
        )

        if success:
            logger.info(f"✅ Branded verification email sent to {payload.email}")
            return {"sent": True, "message": "Beautiful verification email delivered!"}
        else:
            logger.warning(f"⚠️ SMTP not configured for {payload.email}")
            return {"sent": False, "message": "SMTP not configured."}

    except Exception as e:
        logger.error(f"❌ GENERATE+SEND VERIFICATION CRASH: {e}")
        return {"sent": False, "error": str(e)}
