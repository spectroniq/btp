from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.embeddings import embed
from app.services.vector_store import save_job_embedding, match_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


class EmbedJobRequest(BaseModel):
    job_id: str
    description: str


class MatchJobsRequest(BaseModel):
    user_profile: str


@router.post("/embed")
async def embed_job(req: EmbedJobRequest):
    try:
        await save_job_embedding(req.job_id, req.description)
        return {"status": "ok", "job_id": req.job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match")
async def match(req: MatchJobsRequest):
    try:
        embedding = await embed(req.user_profile)
        jobs = await match_jobs(embedding)
        return {"jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))