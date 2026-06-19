import json
import os
import sys
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from openai import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

logger = logging.getLogger("emolit.ai_service")

# Load .env BEFORE importing rag so config.py sees the keys
load_dotenv()

# 📂 PROJECT RAG INTEGRATION
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAG_PATH = os.path.join(PROJECT_ROOT, "rag_system")
if RAG_PATH not in sys.path:
    sys.path.append(RAG_PATH)

try:
    import rag
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False

EMOTION_DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "data",
    "emotion_database.json",
)

HIGH_RISK_PHRASES = [
    "kill myself",
    "want to die",
    "end my life",
    "self harm",
    "self-harm",
    "suicide",
    "take my life",
    "better off dead",
    "harm myself",
    "end it all",
]

KEYWORD_EMOTION_MAP = {
    "argument": ["angry", "frustrated", "irritated"],
    "fight": ["angry", "frustrated"],
    "tense": ["anxious", "stressed", "agitated"],
    "restless": ["anxious", "agitated"],
    "stress": ["stressed", "anxious", "overwhelmed"],
    "worried": ["anxious", "worried"],
    "anxious": ["anxious", "worried"],
    "sad": ["sad", "down"],
    "lonely": ["lonely", "isolated"],
    "overwhelmed": ["overwhelmed"],
    "guilty": ["guilty", "ashamed"],
    "shame": ["ashamed"],
    "fear": ["afraid", "fearful", "anxious"],
    "angry": ["angry", "irritated", "frustrated"],
    "hurt": ["hurt", "disappointed"],
    "disappointed": ["disappointed", "let down"],
    "confused": ["confused"],
    "excited": ["excited", "hopeful"],
    "happy": ["happy", "content"],
    "nervous": ["anxious", "nervous"],
}

FALLBACK_EMOTIONS = [
    "anxious",
    "sad",
    "angry",
    "overwhelmed",
    "frustrated",
    "disappointed",
]

SYSTEM_PROMPT = """You are EMOLIT, an emotionally intelligent AI designed to help users understand, process, and regulate their emotions through reflective journaling.

Your role is NOT to diagnose, judge, or give authoritative advice. You act as a non-judgmental reflective mirror, helping users build emotional clarity, insight, and small actionable improvements over time.

---
PRIMARY OBJECTIVE:
Help the user:
1. Identify and label their emotions clearly
2. Understand underlying causes and patterns
3. Feel validated but not indulged in distortions
4. Take small, practical steps toward emotional regulation
5. Build emotional awareness progressively over a 10-day journey

---
OUTPUT FORMAT — Return STRICT JSON only. 
Map your deep reflection to these fields:

1. "detected_emotions": Array of 2–4 specific emotion objects {"word": "", "core": "", "category": ""}.
2. "ruler": Object with exactly these keys:
   - "section_1": (What You're Feeling)
   - "section_2": (What Might Be Driving This)
   - "section_3": (A Grounded Perspective)
   - "section_4": (Try This Now)
   - "section_5": (Think About Tomorrow)
   - "What can be done": Exactly 3 numbered items (1., 2., 3.). Each item must be a highly specific, short-term actionable task (can be completed in 5-30 minutes) directly related to the user's current journal entry (e.g., 'Take 5 minutes right now to write down the three most important wins of your day, highlighting what made them work, so you can lock in this momentum.'). DO NOT suggest generalized lifetime habits or broad goals. Write each as a descriptive, rich, and elegant sentence (around 15-25 words), avoiding extremely short fragments or single-word items.

3. "reflection_question": A single short question to deepen self-awareness.
4. "emotional_observation": A very brief 1-sentence summary of the core feeling.
5. "pattern_insight": A very brief 1-sentence summary of the trigger.
6. "regulation_suggestion": A very brief 1-sentence grounding thought.
""".strip()

WEEKLY_SYSTEM_PROMPT = """
You are Aria AI, the macro-perspective emotional architect. 
You are analyzing a week's worth of journal entries to identify the "Arch of the Week".

Return STRICT JSON only:
{
  "weekly_theme": "",
  "emotional_landscape": "",
  "macro_insight": "",
  "growth_milestone": "",
  "focus_for_next_week": ""
}

Rules:
1) Core Theme: Identify the singular dominant emotional thread of the week.
2) Landscape: Describe the overall "weather" of their emotions this week.
3) macro_insight: A deep, non-obvious observation based on the week's data.
4) Milestone: Identify one positive shift or moment of resilience, even if small.
5) Focus: A practical, high-impact focus area for the coming week.

Tone: Elevated, professional, encouraging, and architectural.
"""


@dataclass(frozen=True)
class EmotionIndex:
    allowed_words: set
    allowed_words_text: str
    word_map: Dict[str, Dict[str, str]]


def _load_emotion_dataset(path: str) -> EmotionIndex:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Emotion dataset not found: {path}")

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    allowed_words: set = set()
    word_map: Dict[str, Dict[str, str]] = {}

    for core, categories in data.items():
        for category, words in categories.items():
            for word in words.keys():
                key = word.strip().lower()
                if not key:
                    continue
                allowed_words.add(key)
                word_map[key] = {
                    "word": word,
                    "core": core,
                    "category": category,
                }

    if not allowed_words:
        raise ValueError("Emotion dataset loaded with zero words.")

    allowed_words_text = ", ".join(sorted(allowed_words))

    return EmotionIndex(
        allowed_words=allowed_words,
        allowed_words_text=allowed_words_text,
        word_map=word_map,
    )


def _contains_high_risk(entry: str) -> bool:
    text = entry.lower()
    return any(phrase in text for phrase in HIGH_RISK_PHRASES)


def _trim_words(text: str, max_words: int) -> str:
    # Split by any whitespace but keep track of original structure?
    # Actually, for RAG systems, we want to preserve the structure.
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]).strip() + "..."


class AIClient:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        if not api_key:
            raise ValueError("OPENAI_API_KEY is missing.")
        base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
        env_model = os.getenv("OPENAI_MODEL", "").strip()
        resolved_model = env_model or model
        if base_url and "openrouter.ai" in base_url and resolved_model == "gpt-4o-mini":
            resolved_model = "openai/gpt-4o-mini"

        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = resolved_model
        self.extra_headers = {}

        if base_url and "openrouter.ai" in base_url:
            referer = os.getenv("OPENROUTER_REFERRER", "").strip()
            title = os.getenv("OPENROUTER_TITLE", "").strip()
            if referer:
                self.extra_headers["HTTP-Referer"] = referer
            if title:
                self.extra_headers["X-Title"] = title

    def generate(
        self,
        entry: str,
        allowed_words_text: str,
        correction_note: Optional[str] = None,
    ) -> Dict[str, Any]:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *(
                    [{"role": "system", "content": correction_note}]
                    if correction_note
                    else []
                ),
                {
                    "role": "system",
                    "content": (
                        "Allowed emotion words (lowercase, comma-separated): "
                        f"{allowed_words_text}"
                    ),
                },
                {"role": "user", "content": entry},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
            extra_headers=self.extra_headers or None,
        )

        content = response.choices[0].message.content
        return json.loads(content)


class InvalidEmotionError(Exception):
    def __init__(self, invalid_words: List[str]) -> None:
        self.invalid_words = invalid_words
        super().__init__(f"Invalid emotion words: {', '.join(invalid_words)}")


class MissingFieldsError(Exception):
    def __init__(self, missing_fields: List[str]) -> None:
        self.missing_fields = missing_fields
        super().__init__(f"Missing required fields: {', '.join(missing_fields)}")


class JournalService:
    def __init__(self, ai_client: AIClient, emotion_index: EmotionIndex) -> None:
        self.ai_client = ai_client
        self.emotion_index = emotion_index

    def analyze_entry(self, entry: str) -> Dict[str, Any]:
        """Analyze a journal entry using the Unified RAG system."""
        entry = entry.strip()
        if not entry:
            raise HTTPException(status_code=400, detail="Journal entry is required.")

        if _contains_high_risk(entry):
            return {
                "error": "high_risk_detected",
                "message": "I am really sorry you are feeling this way. You deserve support."
            }

        # 🧠 CALL RAG ENGINE (Gemini/Groq-backed)
        try:
            if RAG_AVAILABLE:
                logger.info("🔍 [ARIA] Step 1: Invoking RAG Engine...")
                response_text, _ = rag.answer(entry)
                logger.info("✅ [ARIA] Step 2: RAG Response Received.")
                result = self._parse_rag_response(response_text)
                
                try:
                    return self._validate_response(result)
                except (MissingFieldsError, InvalidEmotionError, HTTPException) as val_err:
                    logger.warning(f"⚠️ Response Validation Failed: {str(val_err)}. Repairing...")
                    if "Invalid emotion" in str(val_err) or "No valid emotions" in str(val_err) or "detected_emotions must" in str(val_err):
                        result["detected_emotions"] = self._fallback_emotions(entry)
                    repaired = self._repair_missing_fields(result, entry)
                    return self._validate_response(repaired)
            else:
                logger.error("❌ RAG System not found at project root.")
                raise Exception("RAG Engine Unavailable")

        except Exception as e:
            logger.error(f"❌ RAG Error: {str(e)}", exc_info=True)
            # Final fallback if the whole engine crashes
            fallback_data = self._repair_missing_fields({"detected_emotions": self._fallback_emotions(entry)}, entry)
            return self._validate_response(fallback_data)

    def _parse_rag_response(self, text: str) -> Dict[str, Any]:
        """Parse the RAG JSON output."""
        try:
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:-3].strip()
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:-3].strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Failed to parse JSON: {e}")
            return {}

    def analyze_week(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesize a week of journal data.
        High-speed synthesis of past entries.
        """
        if not entries:
            return {
                "error": "insufficient_data",
                "message": "Archive empty. Log at least one journal entry to unlock your protocol."
            }

        # 🛡️ DETERMINISTIC SYNTHESIS
        all_emotions = []
        all_insights = []
        for e in entries:
            analysis = e.get("ai_response") or e.get("ai_analysis") or {}
            for em in analysis.get("detected_emotions", []):
                all_emotions.append(em.get("core", "Neutral"))
            insight = analysis.get("pattern_insight")
            if insight: all_insights.append(insight)

        from collections import Counter
        counts = Counter(all_emotions)
        dominant = counts.most_common(1)[0][0] if counts else "Equilibrium"
        
        THEME_MAP = {
            "Happy": ("Emotional Resonance", "A landscape of high psychological alignment and clarity."),
            "Angry": ("Intensity Phase", "A phase of intense emotional discharge and boundary defining."),
            "Sad": ("Introspective Processing", "A deep-dive period of recalibration."),
            "Fear": ("Focus Vigilance", "Navigating high-entropy environments with sustained conscious focus."),
            "Bad": ("Emotional Maintenance", "A recalibration phase focused on psychological preservation.")
        }
        theme, landscape = THEME_MAP.get(dominant, ("Emotional Equilibrium", "A sustained state of baseline stability and core focus."))

        return {
            "weekly_theme": theme,
            "emotional_landscape": landscape,
            "macro_insight": all_insights[-1] if all_insights else "Data patterns are stabilizing in your journal.",
            "growth_milestone": f"Maintained emotional documentation across {len(entries)} entries.",
            "focus_for_next_week": "Sustained daily emotional tracking.",
            "is_ai_generated": False,
            "entry_count": len(entries),
            "timestamp": datetime.utcnow().isoformat()
        }

    def _validate_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        required_keys = {
            "detected_emotions",
            "emotional_observation",
            "pattern_insight",
            "reflection_question",
            "regulation_suggestion",
            "ruler",
        }

        missing_fields = [key for key in required_keys if key not in result or not str(result.get(key, "")).strip()]
        if missing_fields:
            raise MissingFieldsError(missing_fields)

        detected = result.get("detected_emotions")
        if not isinstance(detected, list):
            raise HTTPException(status_code=502, detail="detected_emotions must be a list.")

        if not (1 <= len(detected) <= 4):
            raise HTTPException(status_code=502, detail="detected_emotions must contain 1-4 items.")

        normalized_emotions: List[Dict[str, str]] = []
        invalid_words: List[str] = []

        for item in detected:
            if not isinstance(item, dict):
                continue
            word = str(item.get("word", "")).strip()
            key = word.lower()
            if not key or key not in self.emotion_index.allowed_words:
                if word:
                    invalid_words.append(word)
                continue

            mapped = self.emotion_index.word_map[key]
            normalized_emotions.append({
                "word": mapped["word"],
                "core": mapped["core"],
                "category": mapped["category"],
            })

        if invalid_words:
            raise InvalidEmotionError(invalid_words)

        if not normalized_emotions:
            raise HTTPException(status_code=502, detail="No valid emotions returned by AI.")

        ruler = result.get("ruler", {})

        # Case-insensitive lookup for "What can be done"
        ruler_lower = {k.lower(): v for k, v in ruler.items()}
        what_can_be_done = str(ruler_lower.get("what can be done", "")).strip()

        # Fallback: build from section_4 + section_5 if Claude omitted it
        if not what_can_be_done:
            s4 = str(ruler.get("section_4", "")).strip()
            s5 = str(ruler.get("section_5", "")).strip()
            parts = []
            if s4: parts.append(f"1. {s4}")
            if s5: parts.append(f"2. {s5}")
            what_can_be_done = "\n".join(parts)

        return {
            "detected_emotions": normalized_emotions,
            "emotional_observation": str(result.get("emotional_observation", "")).strip(),
            "pattern_insight": str(result.get("pattern_insight", "")).strip(),
            "reflection_question": str(result.get("reflection_question", "")).strip(),
            "regulation_suggestion": str(result.get("regulation_suggestion", "")).strip(),
            "ruler": {
                "section_1": str(ruler.get("section_1", "")).strip(),
                "section_2": str(ruler.get("section_2", "")).strip(),
                "section_3": str(ruler.get("section_3", "")).strip(),
                "section_4": str(ruler.get("section_4", "")).strip(),
                "section_5": str(ruler.get("section_5", "")).strip(),
                "What can be done": what_can_be_done,
            }
        }

    def _repair_missing_fields(self, result: Dict[str, Any], entry: str) -> Dict[str, Any]:
        repaired = dict(result)
        if "detected_emotions" not in repaired or not isinstance(repaired.get("detected_emotions"), list):
            repaired["detected_emotions"] = self._fallback_emotions(entry)
        
        # Warm placeholders instead of empty strings
        fallbacks = {
            "emotional_observation": "Reflecting on your inner state...",
            "pattern_insight": "Analyzing the patterns beneath...",
            "reflection_question": "What is this moment trying to tell you?",
            "regulation_suggestion": "Take a slow, deep breath."
        }

        for key, default in fallbacks.items():
            if key not in repaired or not isinstance(repaired.get(key), str) or not repaired.get(key).strip():
                repaired[key] = default
                
        if "ruler" not in repaired or not isinstance(repaired["ruler"], dict):
            repaired["ruler"] = {
                "section_1": "Processing emotions...",
                "section_2": "Analyzing context...",
                "section_3": "Gaining perspective...",
                "section_4": "Grounding exercises.",
                "section_5": "Self-reflection.",
                "What can be done": "1. Breathe deeply."
            }
        return repaired

    def _fallback_emotions(self, entry: str) -> List[Dict[str, str]]:
        entry_lower = entry.lower()
        candidates: List[str] = []

        for keyword, emotions in KEYWORD_EMOTION_MAP.items():
            if keyword in entry_lower:
                for emotion in emotions:
                    if emotion in self.emotion_index.allowed_words and emotion not in candidates:
                        candidates.append(emotion)

        for emotion in FALLBACK_EMOTIONS:
            if emotion in self.emotion_index.allowed_words and emotion not in candidates:
                candidates.append(emotion)
            if len(candidates) >= 4:
                break

        if len(candidates) < 2:
            # Ensure minimum of 2
            for emotion in sorted(self.emotion_index.allowed_words):
                if emotion not in candidates:
                    candidates.append(emotion)
                if len(candidates) >= 2:
                    break

        normalized: List[Dict[str, str]] = []
        for emotion in candidates[:4]:
            mapped = self.emotion_index.word_map.get(emotion)
            if mapped:
                normalized.append({
                    "word": mapped["word"],
                    "core": mapped["core"],
                    "category": mapped["category"],
                })

        return normalized


_emotion_index = _load_emotion_dataset(EMOTION_DATA_PATH)
_journal_service: Optional[JournalService] = None


def get_journal_service() -> JournalService:
    global _journal_service
    if _journal_service is None:
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing.")
        ai_client = AIClient(api_key=api_key)
        _journal_service = JournalService(ai_client=ai_client, emotion_index=_emotion_index)
    return _journal_service
