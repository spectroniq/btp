from fastapi import APIRouter, HTTPException

from app.models.interview import (
    FeedbackRequest,
    FeedbackResponse,
    MessageRequest,
    MessageResponse,
)
from app.services.claude import generate_feedback, interview_message

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/message", response_model=MessageResponse)
async def message(req: MessageRequest):
    try:
        response = await interview_message(
            stage=req.stage,
            history=req.history,
            user_message=req.message,
        )
        return MessageResponse(response=response, stage=req.stage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest):
    try:
        feedback = await generate_feedback(
            stage=req.stage,
            transcript=req.transcript,
        )
        return FeedbackResponse(feedback=feedback, stage=req.stage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
