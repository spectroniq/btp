from pydantic import BaseModel


class ReasonRequest(BaseModel):
    user_id: str
    problem_id: str
    problem_description: str
    user_reasoning: str


class ReasonResponse(BaseModel):
    coaching: str
    patterns_found: int
