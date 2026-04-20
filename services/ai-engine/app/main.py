from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from fastapi import FastAPI
from app.routes import dsa, interview, jobs

app = FastAPI(title="BTP AI Engine", version="1.0.0")

app.include_router(dsa.router, prefix="/v1")
app.include_router(interview.router, prefix="/v1")
app.include_router(jobs.router, prefix="/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-engine"}