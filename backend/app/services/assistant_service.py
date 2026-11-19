import re
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.practice_record import PracticeRecord
from app.services import ai_service, document_service, rag_service


SYSTEM_PROMPT = (
    "You are DayDive AI, an intelligent, structured, and encouraging study tutor for students. "
    "Adapt your response style to the user's request:\n"
    "- For broad requests (summaries, unit overviews, 'explain this document', key concepts), "
    "begin with a 1-sentence big-picture orientation, then organize the material into clear numbered sections "
    "with bolded key terms, concise bullet explanations, and Markdown comparison tables whenever contrasting concepts. "
    "End with a brief offer for a deeper dive or practice questions.\n"
    "- For specific questions, give a direct, clear explanation with examples from the material.\n"
    "- Ground your answers ONLY in the provided study material when material is attached. "
    "If a topic is not covered in the excerpts, say so explicitly without inventing facts."
)

SUMMARY_PROMPTS = {
    "quick": (
        "Summarize the following study material in 5–7 clear sentences. "
        "Open with what the material covers overall, then highlight the core concepts a student must remember.\n\nMaterial:\n{content}"
    ),
    "detailed": (
        "Provide a comprehensive, well-structured study summary of the material below. "
        "Open with a 1-sentence overview, then organize into numbered sections with bolded key terms, "
        "concise bullet explanations, and a Markdown comparison table if concepts are contrasted.\n\nMaterial:\n{content}"
    ),
    "points": (
        "Extract the most important exam-ready points from the study material as a "
        "clean bullet list (10–14 bullets) grouped logically if helpful. Each bullet must capture a concrete "
        "definition, rule, or distinction.\n\nMaterial:\n{content}"
    ),
}

FLASHCARD_PROMPT = """Create {count} flashcards from the study material below.

Difficulty: {difficulty}

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
[
  {{"question": "...", "answer": "..."}},
  ...
]

Rules:
- Questions should test understanding, not rote memorization.
- Answers must be concise (1–3 sentences).
- Base every card ONLY on the material provided.
- No duplicates.

Material:
{content}
"""

QUIZ_PROMPT = """Create {count} multiple-choice quiz questions from the study material below.

Difficulty: {difficulty}

Return ONLY valid JSON in this exact shape (no markdown, no extra text):
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "..."
  }},
  ...
]

Rules:
- Exactly 4 options per question.
- "correct_index" is the 0-based index of the correct option.
- One clearly correct answer per question.
- Explanation: 1–2 sentences.
- Base every question ONLY on the material provided.
- No duplicates.

Material:
{content}
"""

BROAD_INTENT_PATTERN = re.compile(
    r"\b(summarize|summary|summarise|overview|recap|outline|explain (the )?(whole|entire|all|unit|chapter|pdf|document|notes)|key (concepts|points|topics|takeaways)|what is this (about|covering)|topics covered)\b",
    re.IGNORECASE,
)


def _filter_chunks(doc: Document, pages: Optional[List[int]]) -> List[dict]:
    chunks = doc.chunks or []
    if not pages:
        return chunks
    s = set(pages)
    return [c for c in chunks if c.get("page") in s]


def _join_text(chunks: List[dict], max_chars: int = 14000) -> str:
    parts = [c["text"] for c in chunks]
    text = "\n\n".join(parts)
    return text[:max_chars]


def _sample_evenly(chunks: List[dict], max_chunks: int = 16, max_chars: int = 14000) -> List[dict]:
    """Select evenly spaced chunks across the document so broad summaries see the full arc."""
    if not chunks:
        return []
    if len(chunks) <= max_chunks:
        selected = chunks
    else:
        step = (len(chunks) - 1) / (max_chunks - 1)
        indices = sorted({round(i * step) for i in range(max_chunks)})
        selected = [chunks[i] for i in indices]

    result = []
    total_chars = 0
    for c in selected:
        txt = c.get("text", "")
        if total_chars + len(txt) > max_chars and result:
            break
        result.append(c)
        total_chars += len(txt)
    return result


# --------------------- Summary ---------------------

async def generate_summary(
    db: AsyncSession,
    user_id: int,
    document_id: int,
    style: str,
    pages: Optional[List[int]] = None,
) -> str:
    doc = await document_service.get_document(db, document_id, user_id)
    chunks = _filter_chunks(doc, pages)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content available for the selected pages.")

    sampled = _sample_evenly(chunks, max_chunks=18, max_chars=14000)
    content = _join_text(sampled, max_chars=14000)
    template = SUMMARY_PROMPTS.get(style)
    if not template:
        raise HTTPException(status_code=400, detail="Invalid summary style.")

    prompt = template.format(content=content)
    return (await ai_service.generate(prompt, system=SYSTEM_PROMPT, temperature=0.25, max_tokens=4096)).strip()


# --------------------- Chat (RAG) ---------------------

async def chat(
    db: AsyncSession,
    user_id: int,
    message: str,
    document_id: Optional[int] = None,
    pages: Optional[List[int]] = None,
    history: Optional[List[dict]] = None,
) -> dict:
    history = history or []
    sources: List[dict] = []

    if document_id:
        doc = await document_service.get_document(db, document_id, user_id)
        doc_chunks = _filter_chunks(doc, pages)
        is_broad = bool(BROAD_INTENT_PATTERN.search(message or ""))

        if is_broad:
            hits = _sample_evenly(doc_chunks, max_chunks=16, max_chars=14000)
        else:
            hits = rag_service.retrieve(doc_chunks, message, top_k=8, pages_filter=pages)
            # Sort selected chunks by page order for coherent reading
            hits = sorted(hits, key=lambda h: (h.get("page") or 0))

        if hits:
            context_block = "\n\n".join(
                f"[Page {h['page']}]\n{h['text']}" for h in hits
            )
            seen_pages = set()
            for h in hits:
                p = h.get("page")
                if p not in seen_pages:
                    seen_pages.add(p)
                    sources.append({
                        "page": p,
                        "preview": h["text"][:140] + ("…" if len(h["text"]) > 140 else ""),
                    })
            system = SYSTEM_PROMPT + (
                "\n\nUse ONLY the following excerpts from the student's uploaded material "
                f"({doc.filename}):\n\n{context_block}"
            )
        else:
            system = SYSTEM_PROMPT + "\n\nNo relevant excerpts were found in the material."
    else:
        system = SYSTEM_PROMPT

    messages: List[dict] = [{"role": "system", "content": system}]
    for h in history[-8:]:
        messages.append(h)
    messages.append({"role": "user", "content": message})

    reply = await ai_service.generate_chat(messages, temperature=0.3, max_tokens=4096)
    return {"reply": reply.strip(), "sources": sources}


# --------------------- Flashcards ---------------------

async def generate_flashcards(
    db: AsyncSession,
    user_id: int,
    document_id: int,
    pages: Optional[List[int]],
    count: int,
    difficulty: str,
):
    doc = await document_service.get_document(db, document_id, user_id)
    chunks = _filter_chunks(doc, pages)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content available for the selected pages.")

    sampled = _sample_evenly(chunks, max_chunks=16, max_chars=14000)
    content = _join_text(sampled, max_chars=14000)
    prompt = FLASHCARD_PROMPT.format(content=content, count=count, difficulty=difficulty)

    data = await ai_service.generate_json(prompt, system=SYSTEM_PROMPT, temperature=0.4)

    if not isinstance(data, list):
        raise HTTPException(status_code=502, detail="AI returned an unexpected format.")

    cards = []
    for item in data[:count]:
        if isinstance(item, dict) and "question" in item and "answer" in item:
            cards.append({"question": str(item["question"]), "answer": str(item["answer"])})

    if not cards:
        raise HTTPException(status_code=502, detail="AI returned no valid flashcards.")

    record = PracticeRecord(
        user_id=user_id,
        document_id=document_id,
        document_name=doc.filename,
        type="flashcards",
        data=cards,
        count=len(cards),
        difficulty=difficulty,
    )
    db.add(record)
    await db.commit()

    return cards


# --------------------- Quiz ---------------------

async def generate_quiz(
    db: AsyncSession,
    user_id: int,
    document_id: int,
    pages: Optional[List[int]],
    count: int,
    difficulty: str,
):
    doc = await document_service.get_document(db, document_id, user_id)
    chunks = _filter_chunks(doc, pages)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content available for the selected pages.")

    sampled = _sample_evenly(chunks, max_chunks=16, max_chars=14000)
    content = _join_text(sampled, max_chars=14000)
    prompt = QUIZ_PROMPT.format(content=content, count=count, difficulty=difficulty)

    data = await ai_service.generate_json(prompt, system=SYSTEM_PROMPT, temperature=0.35)

    if not isinstance(data, list):
        raise HTTPException(status_code=502, detail="AI returned an unexpected format.")

    questions = []
    for item in data[:count]:
        if not isinstance(item, dict):
            continue
        q = item.get("question")
        opts = item.get("options")
        ci = item.get("correct_index")
        if not q or not isinstance(opts, list) or len(opts) != 4:
            continue
        if not isinstance(ci, int) or ci < 0 or ci > 3:
            continue
        questions.append({
            "question": str(q),
            "options": [str(o) for o in opts],
            "correct_index": ci,
            "explanation": str(item.get("explanation", "")),
        })

    if not questions:
        raise HTTPException(status_code=502, detail="AI returned no valid quiz questions.")

    record = PracticeRecord(
        user_id=user_id,
        document_id=document_id,
        document_name=doc.filename,
        type="quiz",
        data=questions,
        count=len(questions),
        difficulty=difficulty,
    )
    db.add(record)
    await db.commit()

    return questions