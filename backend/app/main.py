"""
KIKO AI backend entrypoint.

Old prototype: one 620-line app.py with everything inline and
`allow_origins=["*"]`.

New: modular routers, CORS restricted to configured origins, DB
connection managed via lifespan events, embedding model warmed up
once at startup (same as before, just moved out of module import time).
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import close_mongo_connection, connect_to_mongo
from app.routers import assistant, auth, documents, sessions
from app.services.rag_service import get_embedding_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    get_embedding_model()  # warm up the sentence-transformer once, at boot
    yield
    close_mongo_connection()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

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
app.include_router(sessions.dashboard_router)


@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} API", "status": "running"}
