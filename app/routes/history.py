from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import get_collection
from bson import ObjectId

router = APIRouter(tags=["history"])

@router.get("/history/journals")
@router.get("/api/history/journals")
async def get_journal_history(user: dict = Depends(get_current_user)):
    """Return last 20 journal entries for the logged-in user."""
    user_id = ObjectId(user["user_id"])
    email = user.get("email")
    journals_col = get_collection("journal_entries")
    
    # Robust search using BOTH ID and Email to catch legacy data
    entries = journals_col.find({
        "$or": [
            {"user_id": user_id},
            {"user_email": email}
        ]
    }).sort("created_at", -1).limit(20)
    
    result = []
    for e in entries:
        result.append({
            "id": str(e["_id"]),
            "entry_text": e["entry_text"],
            "ai_response": e.get("ai_response") or e.get("ai_analysis") or {},
            "created_at": e["created_at"]
        })
    return result

@router.get("/history/daily-words")
@router.get("/api/history/daily-words")
async def get_word_history(user: dict = Depends(get_current_user)):
    """Return all words seen by the logged-in user."""
    user_id = ObjectId(user["user_id"])
    email = user.get("email")
    daily_col = get_collection("daily_words_seen")
    
    entries = daily_col.find({
        "$or": [
            {"user_id": user_id},
            {"user_email": email}
        ]
    }).sort("date", -1)
    
    result = []
    for e in entries:
        result.append({
            "id": str(e["_id"]),
            "word": e["word"],
            "core": e["core"],
            "category": e["category"],
            "date": e["date"]
        })
    return result
