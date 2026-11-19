from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.planner import (
    CreatePlanRequest,
    TaskStatusUpdate,
    TaskRescheduleRequest,
    AgentCommandRequest,
    AgentConfirmRequest,
)
from app.services import planner_service

router = APIRouter(prefix="/planner", tags=["Planner"])


@router.post("/plans")
async def create_plan(req: CreatePlanRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.create_plan(db, current_user.id, req)


@router.get("/plans/active")
async def get_active_plan(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = await planner_service.get_active_plan(db, current_user.id)
    return {"has_plan": bool(plan), "plan": plan}


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.list_plans(db, current_user.id)


@router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: int, req: TaskStatusUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.update_task_status(db, current_user.id, task_id, req.status, req.linked_session_id)


@router.patch("/tasks/{task_id}/reschedule")
async def reschedule_task(task_id: int, req: TaskRescheduleRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.reschedule_task(db, current_user.id, task_id, req.scheduled_date)


@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.delete_plan(db, current_user.id, plan_id)


@router.get("/recommendations")
async def list_recommendations(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.list_recommendations(db, current_user.id)


@router.post("/recommendations/analyze")
async def analyze_behavior(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.analyze_and_recommend(db, current_user.id)


@router.post("/recommendations/{rec_id}/apply")
async def apply_recommendation(rec_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.apply_recommendation(db, current_user.id, rec_id)


@router.post("/recommendations/{rec_id}/dismiss")
async def dismiss_recommendation(rec_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.dismiss_recommendation(db, current_user.id, rec_id)


@router.post("/agent/command")
async def agent_command(req: AgentCommandRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.preview_agent_command(db, current_user.id, req.command)


@router.post("/agent/confirm")
async def agent_confirm(req: AgentConfirmRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await planner_service.execute_agent_action(db, current_user.id, req.intent, req.params)