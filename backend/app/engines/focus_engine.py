"""
Rule-based focus classification engine (MindGuard V1).

Input:  study session context (subject, goal) + browser activity
Output: classification (relevant | uncertain | distracting)
        focus_state (focused | attention | distracted)
        reason (short human-readable string)
"""
import re
from urllib.parse import urlparse
from typing import Optional

# ---------------- Domain categories ----------------

EDUCATIONAL_DOMAINS = {
    "wikipedia.org", "docs.python.org", "developer.mozilla.org",
    "stackoverflow.com", "github.com", "gitlab.com", "bitbucket.org",
    "coursera.org", "udemy.com", "khanacademy.org", "edx.org",
    "leetcode.com", "hackerrank.com", "codeforces.com", "codechef.com",
    "geeksforgeeks.org", "w3schools.com", "tutorialspoint.com",
    "javatpoint.com", "medium.com", "dev.to", "freecodecamp.org",
    "arxiv.org", "scholar.google.com", "researchgate.net",
    "nptel.ac.in", "swayam.gov.in",
}

SOCIAL_DOMAINS = {
    "instagram.com", "facebook.com", "twitter.com", "x.com",
    "reddit.com", "tiktok.com", "snapchat.com", "pinterest.com",
    "threads.net", "tumblr.com", "quora.com",
}

ENTERTAINMENT_DOMAINS = {
    "netflix.com", "primevideo.com", "hotstar.com", "disneyplus.com",
    "hulu.com", "spotify.com", "soundcloud.com", "twitch.tv",
    "9gag.com", "buzzfeed.com", "imdb.com", "imdb.in",
}

MESSAGING_DOMAINS = {
    "whatsapp.com", "web.whatsapp.com", "telegram.org", "web.telegram.org",
    "discord.com", "slack.com", "messenger.com",
}

YOUTUBE_HOSTS = {"youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"}

STOPWORDS = {
    "the", "and", "for", "with", "from", "into", "about", "this", "that",
    "these", "those", "will", "would", "should", "could", "have", "has",
    "had", "were", "was", "are", "is", "be", "been", "being", "your",
    "you", "our", "ours", "their", "them", "there", "here", "what",
    "which", "when", "where", "who", "how", "why", "some", "any",
    "more", "most", "other", "such", "than", "then", "also", "just",
    "only", "very", "make", "made", "take", "taken", "using", "use",
    "used", "get", "got", "go", "going", "like", "want", "need",
    "help", "helps", "helping", "well", "good", "better", "best",
    "solve", "solving", "study", "studying", "learn", "learning",
    "complete", "completing", "finish", "finishing", "review", "reviewing",
    "understand", "understanding", "practice", "practicing",
}


def extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return ""


def normalize_domain(domain: str) -> str:
    domain = (domain or "").lower().strip()
    if domain.startswith("www."):
        domain = domain[4:]
    return domain


def _extract_keywords(text: str) -> set:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#]+", (text or "").lower())
    return {w for w in words if len(w) >= 4 and w not in STOPWORDS}


def _title_matches_study_context(session, title: str) -> bool:
    """
    Check if the page title shares meaningful keywords with the session
    subject or goal.
    """
    if not title:
        return False

    title_words = _extract_keywords(title)
    if not title_words:
        return False

    session_keywords = _extract_keywords(
        f"{session.subject or ''} {session.goal or ''}"
    )
    if not session_keywords:
        return False

    overlap = title_words & session_keywords
    # Require at least 1 strong overlap (subjects are usually short)
    return len(overlap) >= 1


# ---------------- Main classifier ----------------

def classify_activity(session, url: str, page_title: Optional[str] = None) -> dict:
    """
    Returns:
      {
        "classification": "relevant" | "uncertain" | "distracting",
        "focus_state":    "focused" | "attention" | "distracted",
        "reason":         str,
      }
    """
    domain = normalize_domain(extract_domain(url))
    title = (page_title or "").strip()
    combined = f"{domain} {title}".lower()

    # 1. Direct distraction categories
    if domain in SOCIAL_DOMAINS:
        return {
            "classification": "distracting",
            "focus_state": "distracted",
            "reason": "Social media is not part of your study goal.",
        }
    if domain in ENTERTAINMENT_DOMAINS:
        return {
            "classification": "distracting",
            "focus_state": "distracted",
            "reason": "Entertainment site detected.",
        }
    if domain in MESSAGING_DOMAINS:
        return {
            "classification": "distracting",
            "focus_state": "distracted",
            "reason": "Messaging apps during a focus session.",
        }

    # 2. YouTube — special treatment
    if domain in YOUTUBE_HOSTS:
        if _title_matches_study_context(session, title):
            return {
                "classification": "relevant",
                "focus_state": "focused",
                "reason": "YouTube video matches your study topic.",
            }
        return {
            "classification": "distracting",
            "focus_state": "distracted",
            "reason": "YouTube content unrelated to your study goal.",
        }

    # 3. Educational sites
    if domain in EDUCATIONAL_DOMAINS:
        return {
            "classification": "relevant",
            "focus_state": "focused",
            "reason": "Educational resource.",
        }

    # 4. Google search — check title
    if "google." in domain and not domain.startswith("scholar."):
        if _title_matches_study_context(session, title):
            return {
                "classification": "relevant",
                "focus_state": "focused",
                "reason": "Search matches your study topic.",
            }
        return {
            "classification": "uncertain",
            "focus_state": "attention",
            "reason": "Search activity — could be study-related.",
        }

    # 5. Title mentions study keywords → relevant
    if _title_matches_study_context(session, title):
        return {
            "classification": "relevant",
            "focus_state": "focused",
            "reason": "Content matches your study topic.",
        }

    # 6. Default
    return {
        "classification": "uncertain",
        "focus_state": "attention",
        "reason": "Activity not obviously related to your study goal.",
    }


# ---------------- Intervention escalation ----------------

def compute_intervention(
    classification: str,
    prior_distraction_count: int,
    prior_distraction_minutes: float,
    time_on_current_seconds: int,
) -> dict:
    """
    Returns:
      {
        "level": 0 | 1 | 2 | 3,
        "title": str | None,
        "message": str | None,
      }
    """
    if classification != "distracting":
        return {"level": 0, "title": None, "message": None}

    current_minutes = max(time_on_current_seconds // 60, 0)

    if prior_distraction_minutes >= 5:
        return {
            "level": 3,
            "title": "MindGuard Alert",
            "message": (
                "This activity doesn't appear related to your study goal. "
                f"You've been here for {current_minutes} minute"
                f"{'s' if current_minutes != 1 else ''}."
            ),
        }
    if prior_distraction_count >= 2 or prior_distraction_minutes >= 2:
        return {
            "level": 2,
            "title": "Getting distracted?",
            "message": (
                f"You've spent about {int(prior_distraction_minutes)} minute"
                f"{'s' if prior_distraction_minutes != 1 else ''} on unrelated "
                "content during this session. Want to get back on track?"
            ),
        }
    return {
        "level": 1,
        "title": "Still working on your goal?",
        "message": "This activity looks unrelated to your study goal.",
    }