"""
Generic AI provider wrapper for DayDive.
Primary provider: Groq, with automatic retries and hardened JSON extraction.
"""
import asyncio
import json
import re
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


async def _call_with_retry(messages: List[dict], temperature: float, max_tokens: int, retries: int = 2) -> str:
    client = _get_client()
    last_err = None

    for attempt in range(retries + 1):
        try:
            response = await client.chat.completions.create(
                model=MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = response.choices[0].message.content or ""
            if content.strip():
                return content
            raise ValueError("Empty response from AI provider.")
        except Exception as e:
            last_err = e
            if attempt < retries:
                await asyncio.sleep(0.8 * (2 ** attempt))

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"AI provider error: {str(last_err)[:200]}",
    )


async def generate(
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Send a single-turn generation request. Returns plain text."""
    messages: List[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return await _call_with_retry(messages, temperature=temperature, max_tokens=max_tokens)


async def generate_chat(
    messages: list,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """Multi-turn chat completion."""
    return await _call_with_retry(messages, temperature=temperature, max_tokens=max_tokens)


def _extract_json(text: str):
    """Strip markdown fences or surrounding prose, then JSON-parse."""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: extract first JSON array or object
        arr_match = re.search(r"(\[.*\])", cleaned, re.DOTALL)
        if arr_match:
            return json.loads(arr_match.group(1))
        obj_match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if obj_match:
            return json.loads(obj_match.group(1))
        raise


async def generate_json(
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.35,
    max_tokens: int = 4096,
):
    """Ask the model for JSON, parse it with one automatic retry on invalid JSON."""
    for attempt in range(2):
        raw = await generate(
            prompt,
            system=system,
            temperature=max(0.15, temperature - (0.15 * attempt)),
            max_tokens=max_tokens,
        )
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, ValueError) as e:
            if attempt == 1:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI returned invalid JSON: {str(e)[:150]}",
                )

                