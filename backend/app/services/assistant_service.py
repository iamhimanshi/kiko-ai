from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
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


async def chat(
    db: AsyncSession,
    user_id: int,
    message: str,
    document_id: Optional[int] = None,
    pages: Optional[List[int]] = None,
    history: Optional[List[dict]] = None,
) -> dict:
    """Return {"reply": str, "sources": [...]}"""
    history = history or []
    sources: List[dict] = []

    # Build conversation context
    messages = []
    if document_id:
        doc = await document_service.get_document(db, document_id, user_id)

        # Retrieve top chunks relevant to the question
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

    messages.append({"role": "system", "content": system})
    for h in history[-6:]:  # last 6 turns
        messages.append(h)
    messages.append({"role": "user", "content": message})

    reply = await ai_service.generate_chat(messages, temperature=0.4)
    return {"reply": reply.strip(), "sources": sources}
