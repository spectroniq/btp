import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.interview import (
    FeedbackRequest,
    FeedbackResponse,
    MessageRequest,
    MessageResponse,
    RealMessageRequest,
    RealMessageResponse,
    RealVerdictRequest,
    RealVerdictResponse,
    AINativeAssistRequest,
    AINativeAssistResponse,
    AINativeEvaluateRequest,
    AINativeEvaluateResponse,
    ScoreDimension,
)
from app.services.claude import (
    generate_feedback,
    interview_message,
    stream_interview_message,
    real_interview_message,
    stream_real_interview_message,
    real_interview_verdict,
    ai_native_assist,
    stream_ai_native_assist,
    ai_native_evaluate,
)

router = APIRouter(prefix="/interview", tags=["interview"])

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}


def _sse_stream(gen):
    async def generate():
        try:
            async for text in gen:
                yield f"data: {json.dumps({'text': text})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream", headers=SSE_HEADERS)


# ── Mock interview ────────────────────────────────────────

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


@router.post("/message/stream")
async def message_stream(req: MessageRequest):
    try:
        return _sse_stream(stream_interview_message(
            stage=req.stage,
            history=req.history,
            user_message=req.message,
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback(req: FeedbackRequest):
    try:
        fb = await generate_feedback(stage=req.stage, transcript=req.transcript)
        return FeedbackResponse(feedback=fb, stage=req.stage)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Real interview ────────────────────────────────────────

@router.post("/real/message", response_model=RealMessageResponse)
async def real_message(req: RealMessageRequest):
    try:
        response = await real_interview_message(
            persona=req.persona,
            stage_label=req.stage_label,
            stage_focus=req.stage_focus,
            company_name=req.company_name,
            history=req.history,
            user_message=req.message,
        )
        return RealMessageResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/real/message/stream")
async def real_message_stream(req: RealMessageRequest):
    try:
        return _sse_stream(stream_real_interview_message(
            persona=req.persona,
            stage_label=req.stage_label,
            stage_focus=req.stage_focus,
            company_name=req.company_name,
            history=req.history,
            user_message=req.message,
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/real/verdict", response_model=RealVerdictResponse)
async def real_verdict(req: RealVerdictRequest):
    try:
        result = await real_interview_verdict(
            persona=req.persona,
            stage_label=req.stage_label,
            company_name=req.company_name,
            transcript=req.transcript,
        )
        return RealVerdictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AI-Native interview ───────────────────────────────────

@router.post("/ai-native/assist", response_model=AINativeAssistResponse)
async def ai_native_assist_route(req: AINativeAssistRequest):
    try:
        response = await ai_native_assist(
            problem_title=req.problem_title,
            problem_context=req.problem_context,
            history=req.history,
            user_message=req.message,
        )
        return AINativeAssistResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-native/assist/stream")
async def ai_native_assist_stream(req: AINativeAssistRequest):
    try:
        return _sse_stream(stream_ai_native_assist(
            problem_title=req.problem_title,
            problem_context=req.problem_context,
            history=req.history,
            user_message=req.message,
        ))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-native/evaluate", response_model=AINativeEvaluateResponse)
async def ai_native_evaluate_route(req: AINativeEvaluateRequest):
    try:
        result = await ai_native_evaluate(
            scenario_title=req.scenario_title,
            scenario_problem=req.scenario_problem,
            ai_conversation=req.ai_conversation,
            solution=req.solution,
            time_taken_minutes=req.time_taken_minutes,
        )
        return AINativeEvaluateResponse(
            decomposition=ScoreDimension(**result["decomposition"]),
            ai_usage=ScoreDimension(**result["ai_usage"]),
            validation=ScoreDimension(**result["validation"]),
            communication=ScoreDimension(**result["communication"]),
            speed=ScoreDimension(**result["speed"]),
            verdict=result["verdict"],
            overall=result["overall"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
