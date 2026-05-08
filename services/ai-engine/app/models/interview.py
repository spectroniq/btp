from pydantic import BaseModel


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
