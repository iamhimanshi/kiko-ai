from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.practice_record import PracticeRecord
from app.services import ai_service, document_service, rag_service


SYSTEM_PROMPT = (
    "You are KIKO, a focused and clear study assistant for students. "
    "You explain concepts accurately and concisely. "
    "When study material is provided, ground your answers ONLY in that material. "
    "If the material doesn't cover something, say so explicitly."
)

SUMMARY_PROMPTS = {
    "quick": (
        "Summarize the following study material in 4–6 sentences. "
        "Focus on the core idea and what a student absolutely must remember. "
        "Use plain, clear language.\n\nMaterial:\n{content}"
    ),
    "detailed": (
        "Provide a detailed summary of the following study material. "
        "Organize it into short paragraphs with clear structure. "
        "Cover definitions, key concepts, and important relationships.\n\nMaterial:\n{content}"
    ),
    "points": (
        "Extract the most important points from the following study material as a "
        "clean bullet list (8–12 bullets). Each bullet must be a single, exam-ready "
        "fact or concept. No intro sentence.\n\nMaterial:\n{content}"
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


def _filter_chunks(doc: Document, pages: Optional[List[int]]) -> List[dict]:
    chunks = doc.chunks or []
    if not pages:
        return chunks
    s = set(pages)
    return [c for c in chunks if c.get("page") in s]


def _join_text(chunks: List[dict], max_chars: int = 12000) -> str:
    parts = [c["text"] for c in chunks]
    text = "\n\n".join(parts)
    return text[:max_chars]


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

    content = _join_text(chunks)
    template = SUMMARY_PROMPTS.get(style)
    if not template:
        raise HTTPException(status_code=400, detail="Invalid summary style.")

    prompt = template.format(content=content)
    return (await ai_service.generate(prompt, system=SYSTEM_PROMPT, temperature=0.3)).strip()


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

        hits = rag_service.retrieve(doc.chunks or [], message, top_k=4, pages_filter=pages)
        if hits:
            context_block = "\n\n".join(
                f"[Page {h['page']}]\n{h['text']}" for h in hits
            )
            sources = [
                {"page": h["page"], "preview": h["text"][:140] + ("…" if len(h["text"]) > 140 else "")}
                for h in hits
            ]
            system = SYSTEM_PROMPT + (
                "\n\nUse ONLY the following excerpts from the student's uploaded material:\n\n"
                f"{context_block}"
            )
        else:
            system = SYSTEM_PROMPT + "\n\nNo relevant excerpts were found in the material."
    else:
        system = SYSTEM_PROMPT

    messages: List[dict] = [{"role": "system", "content": system}]
    for h in history[-6:]:
        messages.append(h)
    messages.append({"role": "user", "content": message})

    reply = await ai_service.generate_chat(messages, temperature=0.4)
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

    content = _join_text(chunks, max_chars=12000)
    prompt = FLASHCARD_PROMPT.format(content=content, count=count, difficulty=difficulty)

    data = await ai_service.generate_json(prompt, system=SYSTEM_PROMPT, temperature=0.6)

    if not isinstance(data, list):
        raise HTTPException(status_code=502, detail="AI returned an unexpected format.")

    cards = []
    for item in data[:count]:
        if isinstance(item, dict) and "question" in item and "answer" in item:
            cards.append({"question": str(item["question"]), "answer": str(item["answer"])})

    if not cards:
        raise HTTPException(status_code=502, detail="AI returned no valid flashcards.")

    # Save to practice history
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

    content = _join_text(chunks, max_chars=12000)
    prompt = QUIZ_PROMPT.format(content=content, count=count, difficulty=difficulty)

    data = await ai_service.generate_json(prompt, system=SYSTEM_PROMPT, temperature=0.5)

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

    # Save to practice history
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