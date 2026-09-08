"""
AI provider abstraction.

Old prototype: hardcoded Groq client + `call_groq()` used directly by
every route.

New: a single `generate(prompt)` entry point that routes to whichever
provider is configured (Groq today, Gemini available as a drop-in
swap later) without touching router/service code elsewhere.
"""
from groq import Groq

from app.core.config import settings

_groq_client: Groq | None = None

GROQ_MODEL_FALLBACK_CHAIN = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

SYSTEM_PROMPT = "You are a helpful AI study assistant. Provide clear, accurate answers."


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = settings.GROQ_API_KEY or "dummy_key"
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def _generate_with_groq(prompt: str) -> str:
    client = _get_groq_client()
    for model in GROQ_MODEL_FALLBACK_CHAIN:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2048,
            )
            return completion.choices[0].message.content
        except Exception:
            continue
    return "I'm having trouble generating a response. Please try again."


def _generate_with_gemini(prompt: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(f"{SYSTEM_PROMPT}\n\n{prompt}")
    return response.text


def generate(prompt: str, provider: str | None = None) -> str:
    """Single entry point every service/router should call."""
    active_provider = provider or settings.DEFAULT_AI_PROVIDER
    if active_provider == "gemini":
        return _generate_with_gemini(prompt)
    return _generate_with_groq(prompt)
