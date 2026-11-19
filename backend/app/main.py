from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, documents, assistant, sessions, mindguard, analytics, planner


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(assistant.router)
app.include_router(sessions.router)
app.include_router(mindguard.router)
app.include_router(analytics.router)
app.include_router(planner.router)


@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}