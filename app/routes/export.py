from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.auth import get_current_user
from datetime import datetime
import calendar
from app.database import get_collection
from bson import ObjectId
from app.services.pdf_service import generate_monthly_report
import logging
from typing import Optional

logger = logging.getLogger("emolit.export")
router = APIRouter(tags=["export"])

@router.get("/export/monthly-report")
@router.get("/api/export/monthly-report")
async def export_monthly_report(
    month: Optional[int] = Query(None, ge=1, le=12),
    year:  Optional[int] = Query(None, ge=2000, le=2100),
    user: dict = Depends(get_current_user)
):
    """
    Generate and stream a premium emotional literacy report for the requested calendar month.
    Defaults to the current month if no month/year is provided.
    """
    try:
        user_email = user.get("email")
        user_id_str = user.get("user_id")

        now = datetime.utcnow()
        target_month = month or now.month
        target_year  = year  or now.year

        month_start = datetime(target_year, target_month, 1)
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        month_end   = datetime(target_year, target_month, days_in_month, 23, 59, 59)
        month_label = month_start.strftime("%B %Y")

        logger.info(f"📄 Generating report for {month_label} — {user_email}")

        try:
            user_id = ObjectId(user_id_str)
        except:
            user_id = user_id_str

        # Fetch journals for the target month only
        journals_col = get_collection("journal_entries")
        journals = list(journals_col.find({
            "$or": [{"user_id": user_id}, {"user_email": user_email}],
            "created_at": {"$gte": month_start, "$lte": month_end}
        }))
        
        for j in journals: 
            j['entry_type'] = 'journal_entry'

        # Helper to safely get datetime
        def to_dt(val):
            if isinstance(val, datetime): return val
            if isinstance(val, str):
                try:
                    # Handle common ISO formats
                    return datetime.fromisoformat(val.replace("Z", "+00:00"))
                except: pass
            return None

        # Fetch Learned Words for the target month (activity tracking)
        learned_col = get_collection("learned_words")
        learned_words = list(learned_col.find({
            "$or": [{"user_id": user_id}, {"user_email": user_email}],
            "created_at": {"$gte": month_start, "$lte": month_end}
        }))
        
        # Fetch ALL Saved Words (For Vocabulary Audit - No 30-day limit here)
        saved_col = get_collection("saved_words")
        saved_words = list(saved_col.find({
            "$or": [{"user_id": user_id}, {"user_email": user_email}]
        }))
        
        processed_entries = []
        seen_word_names = set()

        # 1. Process Saved Words (EXCLUSIVELY for Vocabulary Audit)
        for w in saved_words:
            w_name = w.get("word", "").lower()
            if not w_name or w_name in seen_word_names:
                continue
            seen_word_names.add(w_name)
            
            dt = to_dt(w.get('created_at')) or datetime.utcnow()
            
            # Type 'learned_word' is the hook for the PDF Service Vocabulary Audit
            processed_entries.append({
                'entry_type': 'learned_word', 
                'created_at': dt,
                'word_details': {
                    'word': w.get('word'),
                    'core': w.get('core'),
                    'category': w.get('category'),
                    'metadata': w.get('metadata', {})
                }
            })

        # 2. Process Learned (Searched) Words as 'seen_word' (Activity Grid only)
        for w in learned_words:
            # If already added as a saved word, skip to avoid double activity weight
            if w.get("word", "").lower() in seen_word_names:
                continue
                
            dt = to_dt(w.get('created_at')) or datetime.utcnow()
            processed_entries.append({
                'entry_type': 'seen_word',
                'created_at': dt
            })
        
        combined_entries = journals + processed_entries
        # Robust sort using the parsed datetimes
        combined_entries.sort(key=lambda x: x.get('created_at') or datetime.min)
        
        # 2. Generate PDF
        pdf_buffer = generate_monthly_report(
            user_email, combined_entries,
            month_start=month_start,
            days_in_month=days_in_month,
            month_label=month_label,
        )

        # 3. Stream back
        safe_month = month_start.strftime("%B_%Y").lower()
        safe_user  = user_email.split('@')[0]
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=emolit_{safe_month}_{safe_user}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"❌ Monthly Export failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Neural Engine Error: {str(e)}")
