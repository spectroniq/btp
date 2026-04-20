from contextlib import asynccontextmanager
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from fastapi import FastAPI
from app.routes import dsa, interview, jobs
from app.services.vector_store import init_pool, close_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize shared resources on startup, clean up on shutdown."""
    await init_pool()
    yield
    await close_pool()


app = FastAPI(title="BTP AI Engine", version="1.0.0", lifespan=lifespan)

app.include_router(dsa.router, prefix="/v1")
app.include_router(interview.router, prefix="/v1")
app.include_router(jobs.router, prefix="/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-engine"}