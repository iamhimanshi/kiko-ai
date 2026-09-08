"""
Analytics engine — the focus-score formula and classification tiers,
defined once here so the frontend never has to recompute it (avoids
the "dashboard says 81%, report says 79%" bug the original prototype
was warned against).
"""

CLASSIFICATION_TIERS = [
    (90, 100, "Highly Focused"),
    (75, 89, "Focused"),
    (50, 74, "Moderately Distracted"),
    (0, 49, "Highly Distracted"),
]


def compute_focus_score(focused_seconds: int, distracted_seconds: int) -> float:
    """
    FR-13 formula. Neutral/idle time is intentionally excluded from the
    denominator (see focus_engine docstring) — only focused vs.
    distracted time determines the score.
    """
    total = focused_seconds + distracted_seconds
    if total == 0:
        return 0.0
    return round((focused_seconds / total) * 100, 1)


def classify_score(score: float) -> str:
    for low, high, label in CLASSIFICATION_TIERS:
        if low <= score <= high:
            return label
    return "Highly Distracted"
