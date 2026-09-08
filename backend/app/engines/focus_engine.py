"""
Focus engine — turns a session's raw browser_activity_events into the
building blocks FR-11 needs: focused seconds, distracted seconds, tab
switches, and the per-website time breakdown.

"neutral"-classified time counts toward duration but not toward either
focused or distracted seconds, and is excluded from the focus-score
denominator (see analytics_engine) — an unrecognized site shouldn't
silently drag the score down.
"""
from typing import Any


def summarize_activity(events: list[dict[str, Any]]) -> dict[str, Any]:
    focused_seconds = 0
    distracted_seconds = 0
    neutral_seconds = 0
    tab_switches = 0
    website_totals: dict[str, dict[str, Any]] = {}

    for event in events:
        duration = event.get("duration_seconds", 0) or 0
        classification = event.get("classification", "neutral")
        domain = event.get("domain", "unknown")

        if classification == "relevant":
            focused_seconds += duration
        elif classification == "distracting":
            distracted_seconds += duration
        else:
            neutral_seconds += duration

        if event.get("tab_switch"):
            tab_switches += 1

        bucket = website_totals.setdefault(domain, {"domain": domain, "seconds": 0, "classification": classification})
        bucket["seconds"] += duration
        # Keep the classification that occurred most for this domain if it varied
        bucket["classification"] = classification

    websites = sorted(website_totals.values(), key=lambda w: w["seconds"], reverse=True)

    return {
        "focused_seconds": focused_seconds,
        "distracted_seconds": distracted_seconds,
        "neutral_seconds": neutral_seconds,
        "tab_switches": tab_switches,
        "websites": websites,
    }
