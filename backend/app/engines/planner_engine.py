"""
Deterministic Study Schedule Generator for DayDive.
Allocates realistic daily study blocks based on exam deadline, subject priority,
difficulty, preparation level, and preferred block duration.
"""
from datetime import date, timedelta
from typing import List, Dict

DIFFICULTY_WEIGHT = {"easy": 1.0, "medium": 1.35, "hard": 1.75}
PREP_WEIGHT = {"advanced": 0.8, "intermediate": 1.0, "beginner": 1.3}
SUBJECT_COLORS = ["#FF841C", "#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"]


def generate_schedule(
    start_date: date,
    exam_date: date,
    daily_hours: float,
    preferred_block_minutes: int,
    subjects: List[Dict],
) -> List[Dict]:
    """
    Returns a list of task dicts:
    [{subject_index, title, topic, scheduled_date, duration_minutes, priority}]
    """
    total_days = max(1, min((exam_date - start_date).days + 1, 60))
    daily_minutes = max(30, int(round(daily_hours * 60)))
    base_block = max(20, min(preferred_block_minutes, daily_minutes))

    # Compute weighted demand for each subject
    weights = []
    for idx, s in enumerate(subjects):
        diff_w = DIFFICULTY_WEIGHT.get(s.get("difficulty", "medium"), 1.35)
        prep_w = PREP_WEIGHT.get(s.get("prep_level", "beginner"), 1.0)
        prio_w = float(s.get("priority", 3))
        weights.append(diff_w * prep_w * prio_w)

    total_weight = sum(weights) or 1.0
    total_available_minutes = total_days * daily_minutes

    # Build a queue of study blocks per subject
    subject_queues: List[List[Dict]] = []
    for idx, s in enumerate(subjects):
        share = weights[idx] / total_weight
        subj_minutes = max(base_block, int(round(total_available_minutes * share)))
        block_len = base_block if s.get("difficulty") != "hard" else max(25, min(base_block, 40))

        topics = [t.strip() for t in (s.get("topics") or []) if t.strip()]
        if not topics:
            topics = [f"{s['name']} Core Concepts", f"{s['name']} Practice", f"{s['name']} Revision"]

        num_blocks = max(1, round(subj_minutes / block_len))
        queue = []
        for b in range(num_blocks):
            topic = topics[b % len(topics)]
            cycle_num = (b // len(topics)) + 1
            title = f"{topic}" if cycle_num == 1 else f"{topic} (Review {cycle_num})"
            queue.append({
                "subject_index": idx,
                "title": title,
                "topic": topic,
                "duration_minutes": block_len,
                "priority": s.get("priority", 3),
            })
        subject_queues.append(queue)

    # Distribute blocks round-robin across days weighted by priority
    ordered_indices = sorted(range(len(subjects)), key=lambda i: subjects[i].get("priority", 3), reverse=True)
    tasks: List[Dict] = []
    cursors = [0] * len(subjects)

    for day_offset in range(total_days):
        current_day = start_date + timedelta(days=day_offset)
        remaining_today = daily_minutes
        made_progress = True

        while remaining_today >= 20 and made_progress:
            made_progress = False
            for idx in ordered_indices:
                if cursors[idx] < len(subject_queues[idx]):
                    item = subject_queues[idx][cursors[idx]]
                    if item["duration_minutes"] <= remaining_today or remaining_today == daily_minutes:
                        dur = min(item["duration_minutes"], remaining_today)
                        tasks.append({
                            **item,
                            "duration_minutes": max(20, dur),
                            "scheduled_date": current_day,
                        })
                        cursors[idx] += 1
                        remaining_today -= dur
                        made_progress = True
                        if remaining_today < 20:
                            break

    return tasks