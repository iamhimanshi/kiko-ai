from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.mindguard import (
    ActivityBatchRequest,
    ActivityBatchResponse,
    MindGuardStatusResponse,
    LiveMonitorResponse,
    ExtensionStatusResponse,
)
from app.services import mindguard_service

router = APIRouter(prefix="/mindguard", tags=["MindGuard"])


@router.post("/activity", response_model=ActivityBatchResponse)
async def ingest_activity(
    data: ActivityBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await mindguard_service.process_activity_batch(
        db, current_user.id, data.activities, data.session_id
    )
    return result


@router.get("/status", response_model=MindGuardStatusResponse)
async def status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mindguard_service.get_status(db, current_user.id)


@router.get("/live", response_model=LiveMonitorResponse)
async def live_monitor(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mindguard_service.get_live_monitor(db, current_user.id)


@router.get("/extension-status", response_model=ExtensionStatusResponse)
async def extension_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mindguard_service.get_extension_status(db, current_user.id)