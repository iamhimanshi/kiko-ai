"""
MongoDB connection (Motor async driver).

Replaces the old prototype's in-memory `users_db`, `pdfs_db`, `sessions`
dicts — data now survives a server restart.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def connect_to_mongo() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DB_NAME]


def close_mongo_connection() -> None:
    global _client
    if _client:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _db


# Convenience collection accessors
def users_collection():
    return get_db()["users"]


def documents_collection():
    return get_db()["documents"]


def sessions_collection():
    return get_db()["study_sessions"]


def activity_collection():
    return get_db()["browser_activity_events"]


def distraction_collection():
    return get_db()["distraction_events"]


def reports_collection():
    return get_db()["session_reports"]
