from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.mindguard import (
    ActivityBatchRequest, ActivityBatchResponse,
    MindGuardStatusResponse, LiveMonitorResponse, ExtensionStatusResponse,
    BlockedWebsiteCreate, BlockedWebsiteResponse,
)
from typing import List
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


@router.get("/blocked-websites", response_model=List[BlockedWebsiteResponse])
async def list_blocked(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mindguard_service.list_blocked_websites(db, current_user.id)


@router.post("/blocked-websites", response_model=BlockedWebsiteResponse, status_code=201)
async def add_blocked(
    data: BlockedWebsiteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await mindguard_service.add_blocked_website(db, current_user.id, data)


@router.delete("/blocked-websites/{site_id}", status_code=204)
async def delete_blocked(
    site_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await mindguard_service.delete_blocked_website(db, current_user.id, site_id)
    return None