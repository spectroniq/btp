from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.claude import interview_message, generate_feedback

router = APIRouter(prefix="/interview", tags=["interview"])


class StartRequest(BaseModel):
    user_id: str
    stage: str


class MessageRequest(BaseModel):
    user_id: str
    stage: str
    history: list[dict]
    message: str


class FeedbackRequest(BaseModel):
    stage: str
    transcript: list[dict]


class MessageResponse(BaseModel):
    response: str
    stage: str


class FeedbackResponse(BaseModel):
    feedback: str
    stage: str


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