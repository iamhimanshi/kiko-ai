"""
Relevance engine — the rule-based classifier PRD FR-06/07/08 describe.

Deliberately NOT ML-based: the PRD explicitly puts an ML focus classifier
out of scope for Phase 1 (see PRD "Out of Scope" -> AI). This is a
transparent, explainable baseline: goal text -> keywords -> match against
domain + page title. Good enough to demo, and honest about its limits.
"""
import re
from typing import Literal

Classification = Literal["relevant", "distracting", "neutral"]

# Domains that are almost never educational on their own — a quick win
# that doesn't require any keyword matching.
KNOWN_DISTRACTING_DOMAINS = {
    "instagram.com", "facebook.com", "twitter.com", "x.com", "tiktok.com",
    "reddit.com", "netflix.com", "twitch.tv", "pinterest.com", "snapchat.com",
}

# Domains that are almost always educational, regardless of exact title
# match — reduces false "distracted" flags on legitimate study tools.
KNOWN_EDUCATIONAL_DOMAINS = {
    "leetcode.com", "geeksforgeeks.org", "stackoverflow.com", "github.com",
    "developer.mozilla.org", "w3schools.com", "coursera.org", "udemy.com",
    "khanacademy.org", "wikipedia.org", "docs.python.org", "chatgpt.com",
}

# Domains where content varies wildly (YouTube is educational OR
# entertainment depending on the specific video) — title matching decides.
MIXED_CONTENT_DOMAINS = {"youtube.com", "youtu.be"}

STOPWORDS = {
    "the", "a", "an", "of", "to", "for", "and", "or", "in", "on", "with",
    "complete", "understand", "learn", "study", "practice", "solve",
    "implement", "review", "prepare", "finish", "do", "my",
}


def extract_keywords(goal_text: str) -> list[str]:
    """Turn a free-text study goal into a set of meaningful keywords."""
    words = re.findall(r"[a-zA-Z0-9]+", goal_text.lower())
    keywords = [w for w in words if w not in STOPWORDS and len(w) > 2]
    return keywords or words  # fall back to everything if it all got filtered


def _domain_root(domain: str) -> str:
    """Strip subdomains down to the registrable domain (m.youtube.com -> youtube.com)."""
    parts = domain.lower().split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return domain.lower()


def classify(goal_text: str, domain: str, page_title: str) -> Classification:
    """
    Core FR-06/07/08 decision:
      1. Known-distracting domain -> distracting, no further checks.
      2. Known-educational domain -> relevant, no further checks.
      3. Mixed-content domain (YouTube etc.) -> title must contain a goal keyword.
      4. Everything else -> title/domain must contain a goal keyword.
    """
    root = _domain_root(domain)
    keywords = extract_keywords(goal_text)
    title_lower = (page_title or "").lower()
    domain_lower = domain.lower()

    if root in KNOWN_DISTRACTING_DOMAINS:
        return "distracting"

    if root in KNOWN_EDUCATIONAL_DOMAINS:
        return "relevant"

    haystack = f"{title_lower} {domain_lower}"
    keyword_hit = any(kw in haystack for kw in keywords)

    if root in MIXED_CONTENT_DOMAINS:
        return "relevant" if keyword_hit else "distracting"

    if keyword_hit:
        return "relevant"

    # Unknown domain, no keyword match, not a mixed-content site:
    # treat as neutral rather than distracting — avoids over-flagging
    # legitimate but unrecognized study resources (a course portal, etc.)
    return "neutral"
