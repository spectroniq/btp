import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.dsa import ReasonRequest, ReasonResponse
from app.services.claude import coach_dsa, stream_coach_dsa
from app.services.embeddings import embed
from app.services.vector_store import save_attempt, similar_attempts

router = APIRouter(prefix="/dsa", tags=["dsa"])
logger = logging.getLogger(__name__)

SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@router.post("/reason", response_model=ReasonResponse)
async def reason(req: ReasonRequest):
    try:
        embedding = await embed(req.user_reasoning)
        past_patterns = await similar_attempts(user_id=req.user_id, embedding=embedding, limit=5)
        coaching = await coach_dsa(
            problem=req.problem_description,
            user_reasoning=req.user_reasoning,
            user_code=req.user_code,
            past_patterns=past_patterns,
        )
        await save_attempt(
            user_id=req.user_id,
            problem_id=req.problem_id,
            reasoning=req.user_reasoning,
            embedding=embedding,
            problem_description=req.problem_description,
        )
        return ReasonResponse(coaching=coaching, patterns_found=len(past_patterns))
    except Exception as e:
        logger.exception("DSA route error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reason/stream")
async def reason_stream(req: ReasonRequest):
    try:
        embedding = await embed(req.user_reasoning)
        past_patterns = await similar_attempts(user_id=req.user_id, embedding=embedding, limit=5)
        await save_attempt(
            user_id=req.user_id,
            problem_id=req.problem_id,
            reasoning=req.user_reasoning,
            embedding=embedding,
            problem_description=req.problem_description,
        )

        async def generate():
            try:
                async for text in stream_coach_dsa(
                    problem=req.problem_description,
                    user_reasoning=req.user_reasoning,
                    user_code=req.user_code,
                    past_patterns=past_patterns,
                ):
                    yield f"data: {json.dumps({'text': text})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream", headers=SSE_HEADERS)
    except Exception as e:
        logger.exception("DSA route error")
        raise HTTPException(status_code=500, detail=str(e))
