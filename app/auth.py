import os
import jwt
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase Admin
try:
    # Use absolute path for the service account file
    service_account_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-service-account.json")
    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"⚠️ Firebase Admin initialization warning: {e}")

# Config for legacy/fallback JWT (if still used)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-emolit-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    from app.database import get_collection
    from bson import ObjectId

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try Firebase Token Verification first
    try:
        print(f"🔐 Verifying Firebase Token: {token[:10]}...")
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        print(f"✅ Firebase Verified: {email} (UID: {uid})")
        
        if not uid or not email:
            print("❌ Token missing UID or Email")
            raise credentials_exception
            
        # SYNC WITH MONGODB: Ensure user exists in our local DB
        users_col = get_collection("users")
        db_user = users_col.find_one({"email": email.lower()})
        
        if not db_user:
            print(f"👤 Creating new MongoDB record for: {email}")
            new_user = {
                "email": email.lower(),
                "firebase_uid": uid,
                "full_name": decoded_token.get("name", email.split('@')[0]),
                "created_at": datetime.utcnow()
            }
            result = users_col.insert_one(new_user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(db_user["_id"])
            if "firebase_uid" not in db_user:
                users_col.update_one({"_id": db_user["_id"]}, {"$set": {"firebase_uid": uid}})
            
        return {"user_id": user_id, "email": email, "firebase": True}
        
    except Exception as firebase_err:
        print(f"⚠️ Firebase Verification Failed: {str(firebase_err)}")
        # Fallback to legacy JWT
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("user_id")
            email: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
            return {"user_id": user_id, "email": email, "firebase": False}
        except jwt.PyJWTError:
            print(f"❌ Auth Failed: Firebase Error: {firebase_err}")
            raise credentials_exception


