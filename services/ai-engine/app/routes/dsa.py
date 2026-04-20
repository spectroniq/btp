from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.claude import coach_dsa
from app.services.embeddings import embed
from app.services.vector_store import save_attempt, similar_attempts

router = APIRouter(prefix="/dsa", tags=["dsa"])


class ReasonRequest(BaseModel):
    user_id: str
    problem_id: str
    problem_description: str
    user_reasoning: str


class ReasonResponse(BaseModel):
    coaching: str
    patterns_found: int


@router.post("/reason", response_model=ReasonResponse)
async def reason(req: ReasonRequest):
    try:
        # 1. Embed current reasoning
        embedding = await embed(req.user_reasoning)

        # 2. Retrieve similar past attempts
        past_patterns = await similar_attempts(
            user_id=req.user_id,
            embedding=embedding,
            limit=5,
        )

        # 3. Get Claude coaching
        coaching = await coach_dsa(
            problem=req.problem_description,
            user_reasoning=req.user_reasoning,
            past_patterns=past_patterns,
        )

        # 4. Save this attempt
        await save_attempt(
            user_id=req.user_id,
            problem_id=req.problem_id,
            reasoning=req.user_reasoning,
            embedding=embedding,
        )

        return ReasonResponse(
            coaching=coaching,
            patterns_found=len(past_patterns),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))