from pydantic import BaseModel


# ── Mock interview ────────────────────────────────────────

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


# ── Real interview ────────────────────────────────────────

class RealMessageRequest(BaseModel):
    user_id: str
    persona: str          # full persona string from company JSON
    stage_label: str      # e.g. "System Design"
    stage_focus: str      # what the stage is evaluating
    company_name: str
    history: list[dict]
    message: str


class RealVerdictRequest(BaseModel):
    persona: str
    stage_label: str
    company_name: str
    transcript: list[dict]


class RealMessageResponse(BaseModel):
    response: str


class RealVerdictResponse(BaseModel):
    verdict: str          # Strong Hire / Hire / No Hire / Strong No Hire
    strengths: list[str]
    concerns: list[str]
    assessment: str


# ── AI-Native interview ───────────────────────────────────

class AINativeAssistRequest(BaseModel):
    problem_title: str
    problem_context: str   # full problem statement
    history: list[dict]
    message: str


class AINativeEvaluateRequest(BaseModel):
    scenario_title: str
    scenario_problem: str
    ai_conversation: list[dict]   # the assist chat history
    solution: str                 # candidate's final answer / code
    time_taken_minutes: int


class AINativeAssistResponse(BaseModel):
    response: str


class ScoreDimension(BaseModel):
    score: int
    feedback: str


class AINativeEvaluateResponse(BaseModel):
    decomposition: ScoreDimension
    ai_usage: ScoreDimension
    validation: ScoreDimension
    communication: ScoreDimension
    speed: ScoreDimension
    verdict: str
    overall: str
