"""
Conversational Planner Agent for DayDive.
Parses natural-language schedule requests into structured, previewable actions
using Groq LLM with a deterministic keyword fallback.
"""
from datetime import date, timedelta
from typing import Dict, Any
from app.services import ai_service

AGENT_SYSTEM_PROMPT = """You are the DayDive AI Study Planner Agent.
Convert the student's natural-language request into ONE structured JSON object.

Allowed intents:
1. "reschedule_today" - move today's unfinished tasks to tomorrow or later.
2. "prioritize_subject" - increase priority and add a focused block for a named subject.
3. "shorten_tomorrow" - cap tomorrow's workload to a requested number of minutes/hours.
4. "exam_urgency" - adjust exam_date (if given) and elevate pending task priorities.
5. "explain_only" - answer a question (e.g., "Why am I falling behind?") using their stats without changing tasks.

Return ONLY valid JSON:
{
  "intent": "...",
  "summary": "Clear 1-2 sentence explanation of what will change or direct answer to their question.",
  "requires_confirmation": true,
  "params": {
    "subject_name": "",
    "max_minutes": 120,
    "days_until_exam": null
  }
}
Set "requires_confirmation" to false ONLY when intent is "explain_only".
"""


def _fallback_interpret(command: str, plan_dict: dict, metrics: dict) -> Dict[str, Any]:
    cmd = command.lower()
    if "reschedule" in cmd or "couldn't complete" in cmd or "unfinished" in cmd or "today" in cmd:
        return {
            "intent": "reschedule_today",
            "summary": "Move today's remaining pending tasks to tomorrow so you can catch up cleanly.",
            "requires_confirmation": True,
            "params": {},
        }
    if "more time" in cmd or "prioritize" in cmd or "focus on" in cmd:
        subj = ""
        for s in plan_dict.get("subjects", []):
            if s["name"].lower() in cmd:
                subj = s["name"]
                break
        if not subj and plan_dict.get("subjects"):
            subj = plan_dict["subjects"][0]["name"]
        return {
            "intent": "prioritize_subject",
            "summary": f"Boost priority for {subj or 'your primary subject'} and schedule an extra 45-minute block tomorrow.",
            "requires_confirmation": True,
            "params": {"subject_name": subj},
        }
    if "tomorrow" in cmd and ("hour" in cmd or "only" in cmd or "less" in cmd):
        return {
            "intent": "shorten_tomorrow",
            "summary": "Cap tomorrow's study load to 120 minutes and shift overflow tasks to the following day.",
            "requires_confirmation": True,
            "params": {"max_minutes": 120},
        }
    if "exam" in cmd or "deadline" in cmd:
        return {
            "intent": "exam_urgency",
            "summary": "Elevate priority on all pending tasks ahead of your upcoming deadline.",
            "requires_confirmation": True,
            "params": {},
        }
    overdue = plan_dict.get("total_tasks", 0) - plan_dict.get("completed_tasks", 0)
    ratio = int((metrics or {}).get("avg_completion_ratio", 1.0) * 100)
    return {
        "intent": "explain_only",
        "summary": (
            f"You have {overdue} pending task(s) remaining and your recent session duration ratio is {ratio}%. "
            "Try breaking 45+ minute blocks into 30-minute sprints or rescheduling overdue items."
        ),
        "requires_confirmation": False,
        "params": {},
    }


async def interpret_command(command: str, plan_dict: dict, metrics: dict) -> Dict[str, Any]:
    today_str = date.today().isoformat()
    subj_names = [s["name"] for s in plan_dict.get("subjects", [])]
    context = (
        f"Today: {today_str}\n"
        f"Plan: {plan_dict.get('title')} (Exam: {plan_dict.get('exam_date')}, Days left: {plan_dict.get('days_left')})\n"
        f"Subjects: {', '.join(subj_names)}\n"
        f"Progress: {plan_dict.get('completed_tasks')}/{plan_dict.get('total_tasks')} tasks ({plan_dict.get('completion_rate')}%)\n"
        f"Behaviour metrics: {metrics or {}}\n"
        f"Student command: {command}"
    )
    try:
        parsed = await ai_service.generate_json(context, system=AGENT_SYSTEM_PROMPT, temperature=0.2)
        if isinstance(parsed, dict) and parsed.get("intent"):
            return {
                "intent": str(parsed.get("intent")),
                "summary": str(parsed.get("summary", "")),
                "requires_confirmation": bool(parsed.get("requires_confirmation", True)),
                "params": parsed.get("params") if isinstance(parsed.get("params"), dict) else {},
            }
    except Exception:
        pass

    return _fallback_interpret(command, plan_dict, metrics)