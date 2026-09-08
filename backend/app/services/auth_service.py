"""
Auth business logic.

Old prototype: `users_db = {}` dict, plaintext password compare,
`sessions = {}` dict of random UUIDs with no expiry.

New: MongoDB-backed users, bcrypt hashing, JWT access tokens (self-
expiring, no server-side session state needed).
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, status

from app.core.database import users_collection
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import UserLogin, UserSignup


async def signup(payload: UserSignup) -> dict:
    existing = await users_collection().find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.utcnow().isoformat(),
    }
    await users_collection().insert_one(user_doc)
    return {"name": payload.name, "email": payload.email}


async def login(payload: UserLogin) -> dict:
    user = await users_collection().find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=user["email"])
    return {
        "access_token": token,
        "user": {"name": user["name"], "email": user["email"]},
    }


async def get_user_by_email(email: str) -> Optional[dict]:
    return await users_collection().find_one({"email": email})


async def create_demo_session() -> dict:
    """
    Guest access for the 'View Demo' path (design brief section 13):
    the professor shouldn't have to sign up to see the product. Creates
    a throwaway, fully real user record (so every existing ownership
    check just works unmodified) with a random email, then logs them in.
    """
    guest_id = uuid.uuid4().hex[:10]
    email = f"guest-{guest_id}@kikoguest.example"
    name = "Demo User"

    await users_collection().insert_one({
        "name": name,
        "email": email,
        "hashed_password": hash_password(uuid.uuid4().hex),  # unusable password, guest never logs in again
        "created_at": datetime.utcnow().isoformat(),
        "is_guest": True,
    })

    token = create_access_token(subject=email)
    return {"access_token": token, "user": {"name": name, "email": email}}
