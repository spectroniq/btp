import os
from anthropic import Anthropic
from app.prompts.dsa import DSA_COACH_SYSTEM
from app.prompts.interview import INTERVIEW_STAGES

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def coach_dsa(
    problem: str,
    user_reasoning: str,
    past_patterns: list[dict],
) -> str:
    past_context = ""
    if past_patterns:
        past_context = "\n\nUser's past reasoning patterns on similar problems:\n"
        for i, p in enumerate(past_patterns, 1):
            past_context += f"{i}. {p['reasoning'][:300]}\n"

    response = client.messages.create(
        # model="claude-3-5-sonnet-20241022",
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=DSA_COACH_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": f"Problem:\n{problem}\n\nMy reasoning:\n{user_reasoning}{past_context}",
            }
        ],
    )

    return response.content[0].text


async def interview_message(
    stage: str,
    history: list[dict],
    user_message: str,
) -> str:
    system = INTERVIEW_STAGES.get(stage, INTERVIEW_STAGES["BEHAVIORAL"])

    messages = history + [{"role": "user", "content": user_message}]

    response = client.messages.create(
        # model="claude-3-5-sonnet-20241022",
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system,
        messages=messages,
    )

    return response.content[0].text


async def generate_feedback(stage: str, transcript: list[dict]) -> str:
    formatted = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in transcript
    )

    response = client.messages.create(
        # model="claude-3-5-sonnet-20241022",
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=f"You are evaluating a {stage} interview. Give honest, specific, actionable feedback. Score out of 10. Highlight strengths and clear areas for improvement.",
        messages=[
            {
                "role": "user",
                "content": f"Here is the interview transcript:\n\n{formatted}\n\nProvide detailed feedback.",
            }
        ],
    )

    return response.content[0].text