from fastapi import APIRouter, Depends

from app.schemas.auth import SignupResponse, TokenResponse, UserLogin, UserOut, UserSignup
from app.services import auth_service
from app.utils.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
async def signup(payload: UserSignup):
    user = await auth_service.signup(payload)
    return {"message": "Signup successful", "user": user}


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    result = await auth_service.login(payload)
    return {
        "message": "Login successful",
        "access_token": result["access_token"],
        "user": result["user"],
    }


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return {"name": current_user["name"], "email": current_user["email"]}


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # JWTs are stateless — "logout" just means the client discards the
    # token. Kept as an endpoint for API-shape compatibility with the
    # old session-based flow, and as a hook for a future token-blocklist.
    return {"message": "Logout successful"}


@router.post("/demo", response_model=TokenResponse)
async def start_demo():
    result = await auth_service.create_demo_session()
    return {
        "message": "Demo session started",
        "access_token": result["access_token"],
        "user": result["user"],
    }
