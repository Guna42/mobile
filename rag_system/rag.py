"""
rag.py  —  Retrieval-Augmented Generation engine.

Pipeline:
  1. Embed the user query (sentence-transformers, local)
  2. Retrieve top-K chunks from both ChromaDB collections
  3. Build a prompt with inline source citations
  4. Call Claude (Anthropic) and return the grounded response
"""

from typing import List, Dict, Tuple
import os
import anthropic
from openai import OpenAI
from google import genai
from google.genai import types
import chromadb
from chromadb.utils import embedding_functions

from config import (
    ANTHROPIC_API_KEY, GEMINI_API_KEY, GROQ_API_KEY,
    LLM_MODEL, GROQ_MODEL, LLM_MAX_TOKENS,
    CHROMA_DIR, COLLECTION_EMOTIONS, COLLECTION_TASK,
    EMBED_MODEL, TOP_K,
)


# ── ChromaDB setup ─────────────────────────────────────────────────────────

_chroma_client = None
_embed_fn = None

def _get_collection(name: str):
    global _chroma_client, _embed_fn
    if _chroma_client is None:
        print("[rag] Initializing ChromaDB PersistentClient...")
        _chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
    if _embed_fn is None:
        print("[rag] Loading SentenceTransformer Embedding Model into memory...")
        _embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBED_MODEL
        )
    return _chroma_client.get_collection(name=name, embedding_function=_embed_fn)


# ── Retrieval ──────────────────────────────────────────────────────────────

def retrieve(query: str, top_k: int = TOP_K) -> List[Dict]:
    """
    Query both collections and return merged, de-duplicated results
    sorted by relevance distance (lower = more similar).
    """
    results: List[Dict] = []

    for col_name in (COLLECTION_EMOTIONS,):
        try:
            col = _get_collection(col_name)
            res = col.query(query_texts=[query], n_results=top_k)
        except Exception as e:
            print(f"[rag] Warning: could not query '{col_name}': {e}")
            continue

        for doc, meta, dist in zip(
            res["documents"][0],
            res["metadatas"][0],
            res["distances"][0],
        ):
            results.append({
                "text":       doc,
                "metadata":   meta,
                "distance":   dist,
                "collection": col_name,
            })

    # Sort by cosine distance (ascending = most relevant first)
    results.sort(key=lambda x: x["distance"])
    return results[:top_k * 2]   # return top results across both collections


# ── Citation builder ───────────────────────────────────────────────────────

def _format_citation(chunk: Dict, index: int) -> str:
    """Format a retrieved chunk as a numbered citation block."""
    meta        = chunk["metadata"]
    source      = meta.get("source", "unknown")
    source_type = meta.get("source_type", "general")

    if source == "emotions_vocabulary_xlsx":
        header = (
            f"[{index}] SOURCE: Emotions Vocabulary — "
            f"Word: '{meta.get('word','')}' | "
            f"Category: {meta.get('category','')} | "
            f"Level: {meta.get('level','')}"
        )
    else:
        header = (
            f"[{index}] SOURCE: Task Document ({source_type}) — "
            f"Section: \"{meta.get('heading','')}\" "
            f"(idx: {meta.get('section_index','')})"
        )

    return f"{header}\n{chunk['text']}\n"


# ── Prompt construction ────────────────────────────────────────────────────
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
CORE BEHAVIORAL PRINCIPLES:
- Be empathetic but grounded (avoid over-comforting or exaggeration)
- Be clear and structured, not verbose
- Avoid clinical or diagnostic language
- Avoid generic advice like "stay positive" or "just relax"
- Do not moralize or judge
- Focus on: clarity → insight → action
- Always maintain a calm, professional, and supportive tone

---
EMOTIONAL GRANULARITY RULES:
Always prefer specific emotional language:
- Instead of "stress" → use "performance anxiety", "uncertainty", "pressure"
- Instead of "sad" → use "disappointment", "loneliness", "grief"
- Instead of "angry" → use "frustration", "resentment", "betrayal"
- Acknowledge when multiple or conflicting emotions exist simultaneously.

---
TECHNIQUE SELECTION LOGIC:
Match techniques to the emotional context:
- Anxiety → grounding exercises, breath awareness, control mapping
- Self-doubt → evidence-based reframing, self-compassion prompts
- Overthinking → thought labeling, cognitive defusion
- Low mood → small behavioral activation steps
- Emotional overwhelm → naming emotions + slowing down

---
BREVITY RULE — Every field must be short and punchy. No padding, no lengthy explanations. Less is more.

OUTPUT FORMAT — Return STRICT JSON only. No text before or after the JSON object.
Map your reflection to these fields:

1. "detected_emotions": Array of 2–4 emotion objects {"word": "", "core": "", "category": ""}.
2. "ruler": Object with exactly these keys:
   - "section_1": MAX 2 sentences. Name the specific emotions clearly.
   - "section_2": MAX 2 sentences. The core trigger or pattern, stated plainly.
   - "section_3": MAX 2 sentences. One validation sentence + one realistic reframe.
   - "section_4": MAX 1 sentence. One specific action to do right now.
   - "section_5": MAX 1 sentence. One journaling prompt for tomorrow.
   - "What can be done": Exactly 3 numbered items (1., 2., 3.). Each item must be a highly specific, short-term actionable task (can be completed in 5-30 minutes) directly related to the user's current journal entry (e.g., 'Take 5 minutes right now to write down the three most important wins of your day, highlighting what made them work, so you can lock in this momentum.'). DO NOT suggest generalized lifetime habits or broad goals. Write each as a descriptive, rich, and elegant sentence (around 15-25 words), avoiding extremely short fragments or single-word items.

3. "reflection_question": One short, direct question. Max 15 words.
4. "emotional_observation": 1 sentence. The core feeling in plain language.
5. "pattern_insight": 1 sentence. The trigger, no fluff.
6. "regulation_suggestion": 1 sentence. One grounding action.
"""
def build_prompt(query: str, chunks: List[Dict]) -> str:
    citation_blocks = "\n".join(
        _format_citation(c, i + 1) for i, c in enumerate(chunks)
    )
    return (
        f"USER QUERY:\n{query}\n\n"
        f"RETRIEVED CITATIONS:\n{citation_blocks}\n"
       f"Analyze the user's emotional state and respond using the required format."
    )


# ── Generation ─────────────────────────────────────────────────────────────

_anthropic_client = None

def _generate_claude(prompt: str, system_msg: str) -> str:
    """Primary generation via Claude Sonnet with prompt caching."""
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    message = _anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=LLM_MAX_TOKENS,
        system=[{
            "type": "text",
            "text": system_msg,
            "cache_control": {"type": "ephemeral"}
        }],
        messages=[{"role": "user", "content": prompt}]
    )
    text = message.content[0].text.strip()
    # Extract the JSON object even if Claude wraps it in prose or markdown
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1:
        return text[start:end + 1]
    return text

_openai_client = None

def _generate_openai(prompt: str, system_msg: str) -> str:
    """Grounded generation via OpenAI, OpenRouter, or Groq (OpenAI-compatible)."""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY", "")
        base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None
        _openai_client = OpenAI(api_key=api_key, base_url=base_url)

    base_url = os.getenv("OPENAI_BASE_URL", "").strip() or ""
    env_model = os.getenv("OPENAI_MODEL", "").strip()
    resolved_model = env_model or "gpt-4o-mini"
    if "openrouter.ai" in base_url and resolved_model == "gpt-4o-mini":
        resolved_model = "openai/gpt-4o-mini"

    response = _openai_client.chat.completions.create(
        model=resolved_model,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        max_tokens=LLM_MAX_TOKENS,
        temperature=0.4,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content

_groq_client = None

def _generate_groq(prompt: str, system_msg: str) -> str:
    """Fast fallback generation via Groq."""
    global _groq_client
    if _groq_client is None:
        _groq_client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY)

    response = _groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ],
        max_tokens=LLM_MAX_TOKENS,
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content

_gemini_client = None

def _generate_gemini(prompt: str, system_msg: str) -> str:
    """Last-resort fallback generation via Gemini."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)

    response = _gemini_client.models.generate_content(
        model=LLM_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_msg,
            max_output_tokens=LLM_MAX_TOKENS,
        ),
    )
    return response.text

def generate(query: str, chunks: List[Dict]) -> str:
    """Grounded generation. Tries OpenRouter/OpenAI first, then Claude, then Groq, then Gemini."""
    prompt = build_prompt(query, chunks)

    if os.getenv("OPENAI_API_KEY"):
        try:
            print("[rag] Using OpenAI/OpenRouter for grounded inference...")
            return _generate_openai(prompt, SYSTEM_PROMPT)
        except Exception as e:
            print(f"[rag] OpenAI/OpenRouter failed, trying Claude: {e}")

    if ANTHROPIC_API_KEY:
        try:
            print("[rag] Using Claude Sonnet for intelligent inference...")
            return _generate_claude(prompt, SYSTEM_PROMPT)
        except Exception as e:
            print(f"[rag] Claude failed, trying Groq: {e}")

    if GROQ_API_KEY:
        try:
            print("[rag] Using Groq (Llama3) for fast inference...")
            return _generate_groq(prompt, SYSTEM_PROMPT)
        except Exception as e:
            print(f"[rag] Groq failed, falling back to Gemini: {e}")

    return _generate_gemini(prompt, SYSTEM_PROMPT)


# ── Public API ─────────────────────────────────────────────────────────────

def answer(query: str) -> Tuple[str, List[Dict]]:
    """
    Full RAG pipeline. Optimized for Render to prevent hangs and auto-heals empty DBs.
    """
    import time
    from ingest import run_ingestion
    start_time = time.time()
    chunks = []
    
    # 🏃 1. RETRIEVE (With auto-healing for empty databases)
    try:
        print(f"[rag] Starting retrieval for: {query[:50]}...")
        chunks = retrieve(query)
        
        # 🧪 AUTO-HEALING: If DB is empty, run ingestion once and retry
        if not chunks:
            print("[rag] 🏗️ Database seems empty. Triggering auto-ingestion...")
            run_ingestion()
            chunks = retrieve(query) # Retry once
            
        print(f"[rag] Retrieval complete in {time.time() - start_time:.2f}s (found {len(chunks)} chunks)")
    except Exception as e:
        print(f"[rag] ⚠️ Retrieval skipped due to error: {e}")
        chunks = []

    # 🤖 2. GENERATE (Using the chunks if found, or simple AI if not)
    gen_start = time.time()
    try:
        response = generate(query, chunks)
        print(f"[rag] Generation complete in {time.time() - gen_start:.2f}s")
        return response, chunks
    except Exception as e:
        print(f"[rag] ❌ Generation failed: {e}")
        # Final emergency fallback string that matches the user's required RULER format
        err_response = '''{
  "detected_emotions": [
    { "word": "Overwhelmed", "core": "Fear", "category": "Anxiety" }
  ],
  "emotional_observation": "You are currently experiencing a period of high intensity.",
  "pattern_insight": "This is a natural reaction to the current environment.",
  "reflection_question": "What is the smallest thing you can do to regain a sense of control?",
  "regulation_suggestion": "Focus on your breathing for just 30 seconds.",
  "ruler": {
    "section_1": "Overwhelmed, Anxious",
    "section_2": "A buildup of stress and environmental factors.",
    "section_3": "This feeling is valid and temporary.",
    "section_4": "1. Focus on only one small task for the next hour.",
    "section_5": "Reflect on what triggered this tomorrow.",
    "What can be done": "1. Focus on only one small task for the next hour.\\n2. Take three deep breaths right now.\\n3. Step away from the screen for 5 minutes."
  }
}'''
        return err_response, []


def answer_with_sources(query: str) -> str:
    """Convenience wrapper that appends a source list to the response."""
    response, chunks = answer(query)

    source_list = "\n".join(
        f"  [{i+1}] {c['metadata'].get('source','')} — "
        + (
            f"Word: {c['metadata'].get('word','')}"
            if c["metadata"].get("source") == "emotions_vocabulary_xlsx"
            else f"Section: {c['metadata'].get('heading','')}"
        )
        for i, c in enumerate(chunks)
    )

    return f"{response}\n\n── Sources ──\n{source_list}"
