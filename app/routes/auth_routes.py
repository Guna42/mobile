from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, EmailStr
from app.services.email_service import send_verification_email, send_deletion_email
from app.auth import get_current_user
import logging
import os

logger = logging.getLogger("emolit.auth")
router = APIRouter(tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "super-secret-emolit-key")

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
        email = payload.email.lower().strip()

        # Step A: Setup redirection (where the user goes after clicking the link)
        action_code_settings = None
        if payload.continue_url:
            from firebase_admin.auth import ActionCodeSettings as AdminActionCodeSettings
            action_code_settings = AdminActionCodeSettings(
                url=payload.continue_url,
                handle_code_in_app=False,
            )

        # Step B: Have Firebase generate the secure verification link for this specific email
        # Fallback to None if the continue_url domain is not allowlisted in the Firebase console
        try:
            verification_link = firebase_auth.generate_email_verification_link(
                email,
                action_code_settings=action_code_settings,
            )
        except Exception as fe:
            if "UNAUTHORIZED_DOMAIN" in str(fe) and action_code_settings is not None:
                logger.warning(f"⚠️ Domain not allowlisted for redirect, falling back to default firebase template without continue_url: {payload.continue_url}")
                verification_link = firebase_auth.generate_email_verification_link(
                    email,
                    action_code_settings=None,
                )
            else:
                raise fe

        # Step C: Send our beautiful branded email template with the generated link
        success = send_verification_email(
            user_email=email,
            verification_link=verification_link,
        )

        if success:
            logger.info(f"✅ Branded verification email sent to {email}")
            return {"sent": True, "message": "Beautiful verification email delivered!"}
        else:
            logger.warning(f"⚠️ SMTP not configured for {email}")
            return {"sent": False, "message": "SMTP not configured."}

    except Exception as e:
        logger.error(f"❌ GENERATE+SEND VERIFICATION CRASH: {e}")
        return {"sent": False, "error": str(e)}


# 2b. Request Deletion link
@router.post("/auth/request-delete-account")
@router.post("/api/auth/request-delete-account")
async def request_delete_account(request: Request, user: dict = Depends(get_current_user)):
    """
    Generates a secure deletion confirmation token,
    and sends a branded verification email to the logged in user.
    """
    try:
        from bson import ObjectId
        from app.database import get_collection
        import jwt
        from datetime import datetime, timedelta

        email = user["email"].lower()
        user_id_str = user["user_id"]

        # Find the Firebase UID
        users_col = get_collection("users")
        db_user = users_col.find_one({"_id": ObjectId(user_id_str)})
        firebase_uid = db_user.get("firebase_uid") if db_user else None

        if not firebase_uid:
            from firebase_admin import auth as firebase_auth
            try:
                fb_user = firebase_auth.get_user_by_email(email)
                firebase_uid = fb_user.uid
            except Exception:
                raise HTTPException(status_code=400, detail="Cannot verify Firebase identity for deletion.")

        # Create token (valid for 15 minutes)
        payload = {
            "email": email,
            "firebase_uid": firebase_uid,
            "user_id": user_id_str,
            "exp": datetime.utcnow() + timedelta(minutes=15)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        # Build dynamic deletion link using current request host
        base_url = str(request.base_url).rstrip('/')
        deletion_link = f"{base_url}/api/auth/confirm-delete-account?token={token}"

        success = send_deletion_email(user_email=email, deletion_link=deletion_link)
        if success:
            return {"success": True, "message": "Verification link sent to your email."}
        else:
            raise HTTPException(status_code=500, detail="Failed to send verification email. Try again later.")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ REQUEST DELETION ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 2c. Confirm Deletion link
@router.get("/auth/confirm-delete-account", response_class=HTMLResponse)
@router.get("/api/auth/confirm-delete-account", response_class=HTMLResponse)
async def confirm_delete_account(token: str):
    """
    Decodes the deletion verification token, deletes all user data from MongoDB
    collections, deletes the user from Firebase Auth, and returns a confirmation page.
    """
    try:
        from bson import ObjectId
        from app.database import get_collection
        from firebase_admin import auth as firebase_auth
        import jwt

        # Decode token
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            email = payload["email"].lower()
            firebase_uid = payload["firebase_uid"]
            user_id_str = payload["user_id"]
        except jwt.ExpiredSignatureError:
            return HTMLResponse(content="""
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h2>Link Expired</h2>
                    <p>The deletion verification link has expired. Please request deletion again in the app.</p>
                </div>
            """, status_code=400)
        except jwt.PyJWTError:
            return HTMLResponse(content="""
                <div style="font-family:sans-serif; text-align:center; padding:50px;">
                    <h2>Invalid Link</h2>
                    <p>The deletion link is invalid or corrupted.</p>
                </div>
            """, status_code=400)

        # 1. Delete user record and associated resources from MongoDB
        try:
            user_oid = ObjectId(user_id_str)
        except Exception:
            user_oid = user_id_str

        # Delete from collections
        get_collection("users").delete_many({"$or": [{"_id": user_oid}, {"email": email}]})
        get_collection("journal_entries").delete_many({"$or": [{"user_id": user_oid}, {"user_email": email}]})
        get_collection("learned_words").delete_many({"$or": [{"user_id": user_oid}, {"user_email": email}]})
        get_collection("saved_words").delete_many({"$or": [{"user_id": user_oid}, {"user_email": email}]})
        get_collection("daily_words_seen").delete_many({"$or": [{"user_id": user_oid}, {"user_email": email}, {"email": email}]})
        get_collection("otps").delete_many({"email": email})

        # 2. Delete user from Firebase Auth
        try:
            firebase_auth.delete_user(firebase_uid)
            logger.info(f"🔥 Permanently deleted Firebase user: {firebase_uid}")
        except Exception as fe:
            logger.error(f"⚠️ Firebase delete user warning: {fe}")

        logger.info(f"🔥 Permanently deleted MongoDB and Firebase account data for: {email}")

        # Return beautiful farewell page
        farewell_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Permanently Deleted | Emolit</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0; padding: 0;
            background-color: #FFF8DC;
            font-family: 'Inter', sans-serif;
            color: #3D2520;
            display: flex; align-items: center; justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 500px;
            padding: 40px;
            background: #FFFFFF;
            border-radius: 32px;
            box-shadow: 0 20px 50px rgba(103,72,70,0.08);
            border: 1px solid rgba(103,72,70,0.12);
        }
        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 3rem;
            margin: 0 0 20px;
            font-weight: 600;
            letter-spacing: -1.5px;
            line-height: 1.1;
        }
        p {
            font-size: 1.1rem;
            color: #6B4E4A;
            line-height: 1.6;
            margin-bottom: 30px;
            font-weight: 300;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🌿</div>
        <h1>Farewell.</h1>
        <p>Your Emolit account and all associated emotional data have been permanently deleted. Thank you for sharing your journey with us.</p>
    </div>
</body>
</html>"""
        return HTMLResponse(content=farewell_html)

    except Exception as e:
        logger.error(f"❌ DELETION CONFIRMATION ERROR: {e}")
        return HTMLResponse(content=f"<h3>An unexpected error occurred during account deletion: {e}</h3>", status_code=500)


from app.database import get_collection
from app.services.email_service import send_otp_email
from datetime import datetime, timedelta
import random

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/auth/forgot-password/send-otp")
@router.post("/api/auth/forgot-password/send-otp")
async def send_forgot_password_otp(payload: SendOTPRequest):
    """
    Checks if a user exists in Firebase, generates a 6-digit OTP,
    stores it in MongoDB, and sends a branded OTP email.
    """
    try:
        from firebase_admin import auth as firebase_auth
        email = payload.email.lower().strip()

        # Step 1: Verify the user exists in Firebase Auth
        try:
            firebase_auth.get_user_by_email(email)
        except Exception:
            raise HTTPException(status_code=404, detail="No registered account found with this email.")

        # Step 2: Generate a 6-digit secure numeric OTP
        otp_code = f"{random.randint(100000, 999999)}"

        # Step 3: Save the OTP to MongoDB otps collection
        otps_col = get_collection("otps")
        # Remove any existing pending OTPs for this email to avoid clutter
        otps_col.delete_many({"email": email})
        
        otps_col.insert_one({
            "email": email,
            "otp": otp_code,
            "created_at": datetime.utcnow()
        })

        # Step 4: Send the email
        success = send_otp_email(user_email=email, otp_code=otp_code)
        if success:
            logger.info(f"✅ Forgot Password OTP sent to {email}")
            return {"sent": True, "message": "Verification code sent to your email!"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send verification email. Try again later.")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ SEND OTP ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/forgot-password/verify-otp")
@router.post("/api/auth/forgot-password/verify-otp")
async def verify_forgot_password_otp(payload: VerifyOTPRequest):
    """
    Validates if the provided OTP matches the stored value and is not expired (5 minutes).
    """
    try:
        email = payload.email.lower().strip()
        otps_col = get_collection("otps")
        record = otps_col.find_one({"email": email, "otp": payload.otp})

        if not record:
            raise HTTPException(status_code=400, detail="Invalid verification code.")

        # Check expiration (5 minutes)
        elapsed = datetime.utcnow() - record["created_at"]
        if elapsed > timedelta(minutes=5):
            otps_col.delete_one({"_id": record["_id"]})
            raise HTTPException(status_code=400, detail="Verification code has expired.")

        return {"valid": True, "message": "Code verified successfully!"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ VERIFY OTP ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/forgot-password/reset")
@router.post("/api/auth/forgot-password/reset")
async def reset_forgot_password(payload: ResetPasswordRequest):
    """
    Validates OTP one final time, resets the user's password in Firebase, and deletes the OTP.
    """
    try:
        from firebase_admin import auth as firebase_auth
        email = payload.email.lower().strip()

        # Step 1: Validate the OTP
        otps_col = get_collection("otps")
        record = otps_col.find_one({"email": email, "otp": payload.otp})

        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

        elapsed = datetime.utcnow() - record["created_at"]
        if elapsed > timedelta(minutes=5):
            otps_col.delete_one({"_id": record["_id"]})
            raise HTTPException(status_code=400, detail="Verification code has expired.")

        # Step 2: Reset the password via Firebase Admin SDK
        try:
            firebase_user = firebase_auth.get_user_by_email(email)
            firebase_auth.update_user(firebase_user.uid, password=payload.new_password)
        except Exception as fe:
            logger.error(f"❌ Firebase update password fail: {fe}")
            raise HTTPException(status_code=400, detail="Failed to reset password. Ensure it satisfies security requirements.")

        # Step 3: Delete the verified OTP
        otps_col.delete_one({"_id": record["_id"]})

        logger.info(f"✅ Password successfully reset for {email}")
        return {"success": True, "message": "Your password has been successfully updated!"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ RESET PASSWORD ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
