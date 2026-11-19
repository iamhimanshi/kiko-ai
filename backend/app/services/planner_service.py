from datetime import date, datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.planner import (
    StudyPlan,
    PlanSubject,
    PlannedTask,
    StudentPlannerProfile,
    PlannerRecommendation,
)
from app.models.session import StudySession
from app.models.behavior import BehaviorEvent
from app.schemas.planner import CreatePlanRequest
from app.engines import planner_engine, behaviour_analyzer


def _serialize_plan(plan: StudyPlan) -> dict:
    today = date.today()
    subjects = [
        {
            "id": s.id,
            "name": s.name,
            "difficulty": s.difficulty,
            "priority": s.priority,
            "prep_level": s.prep_level,
            "topics": s.topics or [],
            "color": s.color,
        }
        for s in (plan.subjects or [])
    ]
    subj_map = {s["id"]: s for s in subjects}

    tasks = sorted(plan.tasks or [], key=lambda t: (t.scheduled_date, -t.priority, t.id))
    serialized_tasks = []
    completed_count = 0
    for t in tasks:
        if t.status == "completed":
            completed_count += 1
        s_info = subj_map.get(t.subject_id, {})
        serialized_tasks.append({
            "id": t.id,
            "subject_id": t.subject_id,
            "subject_name": s_info.get("name", ""),
            "subject_color": s_info.get("color", "#FF841C"),
            "title": t.title,
            "topic": t.topic,
            "scheduled_date": t.scheduled_date.isoformat(),
            "duration_minutes": t.duration_minutes,
            "priority": t.priority,
            "status": t.status,
            "is_overdue": t.status == "pending" and t.scheduled_date < today,
            "linked_session_id": t.linked_session_id,
        })

    total_tasks = len(serialized_tasks)
    days_left = max(0, (plan.exam_date - today).days)
    return {
        "id": plan.id,
        "title": plan.title,
        "goal": plan.goal,
        "exam_date": plan.exam_date.isoformat(),
        "days_left": days_left,
        "daily_hours": plan.daily_hours,
        "preferred_block_minutes": plan.preferred_block_minutes,
        "status": plan.status,
        "total_tasks": total_tasks,
        "completed_tasks": completed_count,
        "completion_rate": round((completed_count / total_tasks) * 100) if total_tasks else 0,
        "subjects": subjects,
        "tasks": serialized_tasks,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
    }


async def create_plan(db: AsyncSession, user_id: int, req: CreatePlanRequest) -> dict:
    today = date.today()
    if req.exam_date < today:
        raise HTTPException(status_code=400, detail="Exam date must be today or in the future.")

    await db.execute(
        update(StudyPlan)
        .where(StudyPlan.user_id == user_id, StudyPlan.status == "active")
        .values(status="archived")
    )

    plan = StudyPlan(
        user_id=user_id,
        title=req.title.strip(),
        goal=req.goal.strip(),
        exam_date=req.exam_date,
        daily_hours=req.daily_hours,
        preferred_block_minutes=req.preferred_block_minutes,
        status="active",
    )
    db.add(plan)
    await db.flush()

    created_subjects = []
    for idx, s in enumerate(req.subjects):
        subj = PlanSubject(
            plan_id=plan.id,
            name=s.name.strip(),
            difficulty=s.difficulty,
            priority=s.priority,
            prep_level=s.prep_level,
            topics=[t.strip() for t in s.topics if t.strip()],
            color=planner_engine.SUBJECT_COLORS[idx % len(planner_engine.SUBJECT_COLORS)],
        )
        db.add(subj)
        created_subjects.append(subj)
    await db.flush()

    generated = planner_engine.generate_schedule(
        start_date=today,
        exam_date=req.exam_date,
        daily_hours=req.daily_hours,
        preferred_block_minutes=req.preferred_block_minutes,
        subjects=[s.model_dump() for s in req.subjects],
    )

    for item in generated:
        subj = created_subjects[item["subject_index"]]
        db.add(PlannedTask(
            plan_id=plan.id,
            subject_id=subj.id,
            user_id=user_id,
            title=item["title"],
            topic=item["topic"],
            scheduled_date=item["scheduled_date"],
            duration_minutes=item["duration_minutes"],
            priority=item["priority"],
            status="pending",
        ))

    await db.commit()
    return await get_plan_by_id(db, user_id, plan.id)


async def get_plan_by_id(db: AsyncSession, user_id: int, plan_id: int) -> Optional[dict]:
    res = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.id == plan_id, StudyPlan.user_id == user_id)
        .options(selectinload(StudyPlan.subjects), selectinload(StudyPlan.tasks))
    )
    plan = res.scalar_one_or_none()
    return _serialize_plan(plan) if plan else None


async def get_active_plan(db: AsyncSession, user_id: int) -> Optional[dict]:
    res = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.user_id == user_id, StudyPlan.status == "active")
        .options(selectinload(StudyPlan.subjects), selectinload(StudyPlan.tasks))
        .order_by(StudyPlan.created_at.desc())
        .limit(1)
    )
    plan = res.scalar_one_or_none()
    return _serialize_plan(plan) if plan else None


async def list_plans(db: AsyncSession, user_id: int) -> list:
    res = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.user_id == user_id)
        .options(selectinload(StudyPlan.subjects), selectinload(StudyPlan.tasks))
        .order_by(StudyPlan.created_at.desc())
    )
    return [_serialize_plan(p) for p in res.scalars().all()]


async def update_task_status(
    db: AsyncSession, user_id: int, task_id: int, status: str, linked_session_id: Optional[int] = None
) -> dict:
    res = await db.execute(
        select(PlannedTask).where(PlannedTask.id == task_id, PlannedTask.user_id == user_id)
    )
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Planned task not found.")

    task.status = status
    task.completed_at = datetime.now(timezone.utc) if status == "completed" else None
    if linked_session_id is not None:
        task.linked_session_id = linked_session_id

    await db.commit()
    return {"id": task.id, "status": task.status, "linked_session_id": task.linked_session_id}


async def reschedule_task(db: AsyncSession, user_id: int, task_id: int, scheduled_date: date) -> dict:
    res = await db.execute(
        select(PlannedTask).where(PlannedTask.id == task_id, PlannedTask.user_id == user_id)
    )
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Planned task not found.")

    task.scheduled_date = scheduled_date
    await db.commit()
    return {"id": task.id, "scheduled_date": task.scheduled_date.isoformat()}


async def delete_plan(db: AsyncSession, user_id: int, plan_id: int) -> dict:
    res = await db.execute(
        select(StudyPlan).where(StudyPlan.id == plan_id, StudyPlan.user_id == user_id)
    )
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found.")
    await db.delete(plan)
    await db.commit()
    return {"deleted": True, "id": plan_id}


# ──────────────────────── Phase 2: Behaviour & Recommendations ────────────────────────

def _serialize_rec(r: PlannerRecommendation) -> dict:
    return {
        "id": r.id,
        "plan_id": r.plan_id,
        "observation": r.observation,
        "suggestion": r.suggestion,
        "action_type": r.action_type,
        "action_payload": r.action_payload or {},
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


async def analyze_and_recommend(db: AsyncSession, user_id: int) -> dict:
    plan_dict = await get_active_plan(db, user_id)
    if not plan_dict:
        raise HTTPException(status_code=400, detail="Create an active study plan first.")

    since = datetime.now(timezone.utc) - timedelta(days=30)
    s_res = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user_id, StudySession.created_at >= since)
        .order_by(StudySession.created_at.desc())
    )
    sessions = list(s_res.scalars().all())
    session_ids = [s.id for s in sessions]

    events = []
    if session_ids:
        e_res = await db.execute(
            select(BehaviorEvent).where(BehaviorEvent.session_id.in_(session_ids))
        )
        events = list(e_res.scalars().all())

    analysis = behaviour_analyzer.analyze_behaviour(sessions, events, plan_dict)
    metrics = analysis["metrics"]

    # Upsert StudentPlannerProfile
    prof_res = await db.execute(
        select(StudentPlannerProfile).where(StudentPlannerProfile.user_id == user_id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        profile = StudentPlannerProfile(user_id=user_id)
        db.add(profile)
    profile.peak_time_slot = metrics["peak_time_slot"]
    profile.avg_completion_rate = metrics["avg_completion_ratio"]
    profile.learned_patterns = metrics

    # Replace old pending recommendations for this plan with fresh ones
    existing_res = await db.execute(
        select(PlannerRecommendation).where(
            PlannerRecommendation.plan_id == plan_dict["id"],
            PlannerRecommendation.status == "pending",
        )
    )
    for old in existing_res.scalars().all():
        await db.delete(old)

    created = []
    for c in analysis["candidates"]:
        rec = PlannerRecommendation(
            plan_id=plan_dict["id"],
            user_id=user_id,
            observation=c["observation"],
            suggestion=c["suggestion"],
            action_type=c["action_type"],
            action_payload=c["action_payload"],
            status="pending",
        )
        db.add(rec)
        created.append(rec)

    await db.commit()
    return {
        "metrics": metrics,
        "recommendations": [_serialize_rec(r) for r in created],
    }


async def list_recommendations(db: AsyncSession, user_id: int) -> dict:
    plan_dict = await get_active_plan(db, user_id)
    if not plan_dict:
        return {"metrics": None, "recommendations": []}

    prof_res = await db.execute(
        select(StudentPlannerProfile).where(StudentPlannerProfile.user_id == user_id)
    )
    profile = prof_res.scalar_one_or_none()

    rec_res = await db.execute(
        select(PlannerRecommendation)
        .where(
            PlannerRecommendation.plan_id == plan_dict["id"],
            PlannerRecommendation.user_id == user_id,
        )
        .order_by(PlannerRecommendation.created_at.desc())
    )
    recs = [_serialize_rec(r) for r in rec_res.scalars().all()]
    return {
        "metrics": profile.learned_patterns if profile else None,
        "recommendations": recs,
    }


async def apply_recommendation(db: AsyncSession, user_id: int, rec_id: int) -> dict:
    res = await db.execute(
        select(PlannerRecommendation).where(
            PlannerRecommendation.id == rec_id,
            PlannerRecommendation.user_id == user_id,
        )
    )
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")

    today = date.today()
    t_res = await db.execute(
        select(PlannedTask).where(
            PlannedTask.plan_id == rec.plan_id,
            PlannedTask.user_id == user_id,
            PlannedTask.status == "pending",
        )
    )
    pending_tasks = list(t_res.scalars().all())
    updated_count = 0

    if rec.action_type == "split_blocks":
        target = int((rec.action_payload or {}).get("target_duration", 30))
        for t in pending_tasks:
            if t.duration_minutes >= 45:
                half = max(20, min(target, t.duration_minutes // 2))
                t.duration_minutes = half
                db.add(PlannedTask(
                    plan_id=t.plan_id,
                    subject_id=t.subject_id,
                    user_id=user_id,
                    title=f"{t.title} (Part 2)",
                    topic=t.topic,
                    scheduled_date=t.scheduled_date,
                    duration_minutes=half,
                    priority=t.priority,
                    status="pending",
                ))
                updated_count += 1
    elif rec.action_type == "reschedule_overdue":
        for idx, t in enumerate(pending_tasks):
            if t.scheduled_date < today:
                t.scheduled_date = today + timedelta(days=idx % 3)
                updated_count += 1
    elif rec.action_type == "prioritize_exam":
        for t in pending_tasks:
            t.priority = 5
            updated_count += 1

    rec.status = "applied"
    await db.commit()
    return {"applied": True, "updated_tasks": updated_count, "recommendation": _serialize_rec(rec)}


async def dismiss_recommendation(db: AsyncSession, user_id: int, rec_id: int) -> dict:
    res = await db.execute(
        select(PlannerRecommendation).where(
            PlannerRecommendation.id == rec_id,
            PlannerRecommendation.user_id == user_id,
        )
    )
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found.")
    rec.status = "dismissed"
    await db.commit()
    return {"dismissed": True, "id": rec_id}

# ──────────────────────── Phase 3: Conversational Agent ────────────────────────

async def preview_agent_command(db: AsyncSession, user_id: int, command: str) -> dict:
    plan_dict = await get_active_plan(db, user_id)
    if not plan_dict:
        raise HTTPException(status_code=400, detail="Create an active study plan first.")

    rec_info = await list_recommendations(db, user_id)
    metrics = rec_info.get("metrics") or {}
    parsed = await planner_agent.interpret_command(command, plan_dict, metrics)

    today_iso = date.today().isoformat()
    tomorrow_iso = (date.today() + timedelta(days=1)).isoformat()
    tasks = plan_dict.get("tasks", [])
    intent = parsed["intent"]
    affected = 0

    if intent == "reschedule_today":
        affected = sum(1 for t in tasks if t["status"] == "pending" and t["scheduled_date"] <= today_iso)
    elif intent == "prioritize_subject":
        subj = (parsed["params"].get("subject_name") or "").lower()
        affected = sum(1 for t in tasks if t["status"] == "pending" and (not subj or subj in t["subject_name"].lower()))
    elif intent == "shorten_tomorrow":
        affected = sum(1 for t in tasks if t["status"] == "pending" and t["scheduled_date"] == tomorrow_iso)
    elif intent == "exam_urgency":
        affected = sum(1 for t in tasks if t["status"] == "pending")

    return {
        **parsed,
        "affected_tasks": affected,
    }


async def execute_agent_action(db: AsyncSession, user_id: int, intent: str, params: dict) -> dict:
    plan_res = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.user_id == user_id, StudyPlan.status == "active")
        .options(selectinload(StudyPlan.subjects), selectinload(StudyPlan.tasks))
        .order_by(StudyPlan.created_at.desc())
        .limit(1)
    )
    plan = plan_res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=400, detail="No active study plan found.")

    today = date.today()
    tomorrow = today + timedelta(days=1)
    pending = [t for t in (plan.tasks or []) if t.status == "pending"]
    updated = 0

    if intent == "reschedule_today":
        for t in pending:
            if t.scheduled_date <= today:
                t.scheduled_date = tomorrow
                updated += 1
    elif intent == "prioritize_subject":
        subj_name = (params.get("subject_name") or "").lower()
        target_subj = next(
            (s for s in (plan.subjects or []) if subj_name and subj_name in s.name.lower()),
            (plan.subjects or [None])[0],
        )
        if target_subj:
            for t in pending:
                if t.subject_id == target_subj.id:
                    t.priority = 5
                    updated += 1
            db.add(PlannedTask(
                plan_id=plan.id,
                subject_id=target_subj.id,
                user_id=user_id,
                title=f"{target_subj.name} Extra Focus Block",
                topic="Priority Revision",
                scheduled_date=tomorrow,
                duration_minutes=45,
                priority=5,
                status="pending",
            ))
            updated += 1
    elif intent == "shorten_tomorrow":
        max_min = int(params.get("max_minutes") or 120)
        acc = 0
        for t in pending:
            if t.scheduled_date == tomorrow:
                if acc + t.duration_minutes <= max_min:
                    acc += t.duration_minutes
                else:
                    t.scheduled_date = tomorrow + timedelta(days=1)
                    updated += 1
    elif intent == "exam_urgency":
        days_until = params.get("days_until_exam")
        if isinstance(days_until, int) and days_until >= 1:
            plan.exam_date = today + timedelta(days=days_until)
        for t in pending:
            t.priority = 5
            updated += 1

    await db.commit()
    return {"executed": True, "intent": intent, "updated_tasks": updated}