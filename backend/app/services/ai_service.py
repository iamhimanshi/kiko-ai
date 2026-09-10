"""
Generic AI provider wrapper for KIKO.
Primary provider: Groq.
Features depend on this abstraction, not directly on Groq SDK.
"""
from typing import Optional, List
from groq import AsyncGroq
from fastapi import HTTPException, status
from app.core.config import settings



_client: Optional[AsyncGroq] = None

# MODEL = "llama-3.3-70b-versatile"
MODEL = "openai/gpt-oss-120b"


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is not configured (missing GROQ_API_KEY).",
            )
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


async def generate(
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.4,
    max_tokens: int = 2048,
) -> str:
    """
    Send a single-turn generation request.
    Returns plain text. Raises HTTPException on failure.
    """
    client = _get_client()

    messages: List[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {str(e)[:200]}",
        )


async def generate_chat(messages: list, temperature: float = 0.4, max_tokens: int = 2048) -> str:
    """Multi-turn chat completion."""
    client = _get_client()
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {str(e)[:200]}",
        )


import json
import re


def _extract_json(text: str):
    """Strip markdown code fences if present, then JSON-parse."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


async def generate_json(
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.5,
    max_tokens: int = 4096,
):
    """
    Ask the model for JSON, parse it, return Python object.
    Raises HTTPException on failure.
    """
    raw = await generate(prompt, system=system, temperature=temperature, max_tokens=max_tokens)
    try:
        return _extract_json(raw)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI returned invalid JSON: {str(e)[:150]}",
        )