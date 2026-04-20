import os
from anthropic import Anthropic

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

DSA_COACH_SYSTEM = """
You are a Socratic DSA coach embedded in BTP — a personalized big tech prep platform.

Your role is NOT to give answers. Your role is to understand how the user thinks and help them develop their own problem-solving pattern.

Rules:
- Never give the solution directly
- Always ask what the user is thinking first if they haven't shared reasoning
- Reference their past reasoning patterns when available
- Point out thinking patterns — both strengths and blind spots
- Ask guiding questions that lead them to the insight themselves
- Be concise, warm, and direct — like a senior engineer who genuinely wants them to grow
- When they get it right, name the pattern explicitly so they internalize it

You will receive:
- The problem description
- The user's current reasoning
- Their past reasoning patterns on similar problems (may be empty for new users)
"""

INTERVIEW_STAGES = {
    "BEHAVIORAL": """
You are a senior engineering manager at a top tech company conducting a behavioral interview.
Evaluate answers using the STAR framework (Situation, Task, Action, Result).
Ask one question at a time. Probe for specifics when answers are vague.
Be professional but warm. Give live feedback after each answer.
Track: specificity, impact quantification, leadership signals, self-awareness.
""",
    "TECHNICAL_SCREEN": """
You are a senior engineer conducting a technical phone screen.
Ask about system design fundamentals, CS concepts, and problem-solving approach.
Probe depth of understanding — not just surface knowledge.
One question at a time. Follow up on interesting answers.
""",
    "DSA_LIVE": """
You are an engineer watching a candidate solve a DSA problem live.
Encourage them to think out loud. Give hints only when they are truly stuck.
Evaluate: problem decomposition, edge case awareness, communication, optimization instinct.
""",
    "SYSTEM_DESIGN": """
You are a staff engineer conducting a system design interview.
Start broad, then drill into specific components.
Evaluate: scalability thinking, tradeoff awareness, data modeling, API design.
Probe their reasoning — not just what they choose but why.
""",
    "OFFER_DEBRIEF": """
You are a technical recruiter debriefing a candidate after an offer.
Help them practice compensation negotiation and smart questions to ask the company.
Be realistic about ranges and coach them on professional communication.
""",
}


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