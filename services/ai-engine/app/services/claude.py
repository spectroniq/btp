import json
import os
import re
from openai import AsyncOpenAI
from app.prompts.dsa import DSA_COACH_SYSTEM
from app.prompts.interview import (
    INTERVIEW_STAGES,
    real_interviewer_system,
    real_verdict_system,
    ai_native_evaluator_system,
    AI_NATIVE_ASSISTANT_SYSTEM,
)

client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY", "not-configured"),
    base_url="https://openrouter.ai/api/v1",
)

# Override with OPENROUTER_MODEL env var to use any model on OpenRouter:
#   free:  meta-llama/llama-3.3-70b-instruct:free  (default)
#          google/gemini-2.0-flash-exp:free
#          deepseek/deepseek-r1:free
#   paid:  anthropic/claude-sonnet-4-5
#          anthropic/claude-haiku-3-5
MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")


def _msgs(system: str, messages: list[dict]) -> list[dict]:
    return [{"role": "system", "content": system}] + messages


def _parse_json(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return json.loads(match.group())
    return json.loads(text.strip())


# ── DSA ──────────────────────────────────────────────────────────────────────

async def coach_dsa(problem: str, user_reasoning: str, user_code: str, past_patterns: list[dict]) -> str:
    past_context = ""
    if past_patterns:
        past_context = "\n\nUser's past reasoning patterns on similar problems:\n"
        for i, p in enumerate(past_patterns, 1):
            past_context += f"{i}. {p['reasoning'][:300]}\n"

    code_section = _code_section(user_code)

    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        messages=_msgs(DSA_COACH_SYSTEM, [
            {"role": "user", "content": f"Problem:\n{problem}{code_section}\n\nMy reasoning:\n{user_reasoning}{past_context}"},
        ]),
    )
    return response.choices[0].message.content


def _code_section(user_code: str, max_lines: int = 150) -> str:
    if not user_code.strip():
        return ""
    lines = user_code.splitlines()
    truncated = "\n".join(lines[:max_lines])
    if len(lines) > max_lines:
        truncated += f"\n# ... ({len(lines) - max_lines} more lines not shown)"
    return f"\n\nUser's current code:\n```python\n{truncated}\n```"


async def stream_coach_dsa(problem: str, user_reasoning: str, user_code: str, past_patterns: list[dict]):
    past_context = ""
    if past_patterns:
        past_context = "\n\nUser's past reasoning patterns on similar problems:\n"
        for i, p in enumerate(past_patterns, 1):
            past_context += f"{i}. {p['reasoning'][:300]}\n"

    code_section = _code_section(user_code)

    stream = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        stream=True,
        messages=_msgs(DSA_COACH_SYSTEM, [
            {"role": "user", "content": f"Problem:\n{problem}{code_section}\n\nMy reasoning:\n{user_reasoning}{past_context}"},
        ]),
    )
    async for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield text


# ── Mock interview ────────────────────────────────────────────────────────────

async def interview_message(stage: str, history: list[dict], user_message: str) -> str:
    system = INTERVIEW_STAGES.get(stage, INTERVIEW_STAGES["BEHAVIORAL"])
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        messages=_msgs(system, history + [{"role": "user", "content": user_message}]),
    )
    return response.choices[0].message.content


async def stream_interview_message(stage: str, history: list[dict], user_message: str):
    system = INTERVIEW_STAGES.get(stage, INTERVIEW_STAGES["BEHAVIORAL"])
    stream = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        stream=True,
        messages=_msgs(system, history + [{"role": "user", "content": user_message}]),
    )
    async for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield text


async def generate_feedback(stage: str, transcript: list[dict]) -> str:
    formatted = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in transcript)
    system = f"You are evaluating a {stage} interview. Give honest, specific, actionable feedback. Score out of 10. Highlight strengths and clear areas for improvement."
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1000,
        messages=_msgs(system, [
            {"role": "user", "content": f"Here is the interview transcript:\n\n{formatted}\n\nProvide detailed feedback."},
        ]),
    )
    return response.choices[0].message.content


# ── Real interview ────────────────────────────────────────────────────────────

async def real_interview_message(
    persona: str, stage_label: str, stage_focus: str, company_name: str,
    history: list[dict], user_message: str,
) -> str:
    system = real_interviewer_system(persona, stage_label, stage_focus, company_name)
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=800,
        messages=_msgs(system, history + [{"role": "user", "content": user_message}]),
    )
    return response.choices[0].message.content


async def stream_real_interview_message(
    persona: str, stage_label: str, stage_focus: str, company_name: str,
    history: list[dict], user_message: str,
):
    system = real_interviewer_system(persona, stage_label, stage_focus, company_name)
    stream = await client.chat.completions.create(
        model=MODEL,
        max_tokens=800,
        stream=True,
        messages=_msgs(system, history + [{"role": "user", "content": user_message}]),
    )
    async for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield text


async def real_interview_verdict(
    persona: str, stage_label: str, company_name: str, transcript: list[dict],
) -> dict:
    formatted = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in transcript)
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=800,
        messages=_msgs(real_verdict_system(persona, stage_label, company_name), [
            {"role": "user", "content": f"Interview transcript:\n\n{formatted}\n\nProvide the hiring verdict."},
        ]),
    )
    return _parse_json(response.choices[0].message.content)


# ── AI-Native interview ───────────────────────────────────────────────────────

async def ai_native_assist(
    problem_title: str, problem_context: str, history: list[dict], user_message: str,
) -> str:
    context_msg = f"The user is working on: {problem_title}\n\nProblem context:\n{problem_context}"
    messages = (
        [{"role": "user", "content": f"{context_msg}\n\n---\n\n{user_message}"}]
        if not history
        else history + [{"role": "user", "content": user_message}]
    )
    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1500,
        messages=_msgs(AI_NATIVE_ASSISTANT_SYSTEM, messages),
    )
    return response.choices[0].message.content


async def stream_ai_native_assist(
    problem_title: str, problem_context: str, history: list[dict], user_message: str,
):
    context_msg = f"The user is working on: {problem_title}\n\nProblem context:\n{problem_context}"
    messages = (
        [{"role": "user", "content": f"{context_msg}\n\n---\n\n{user_message}"}]
        if not history
        else history + [{"role": "user", "content": user_message}]
    )
    stream = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1500,
        stream=True,
        messages=_msgs(AI_NATIVE_ASSISTANT_SYSTEM, messages),
    )
    async for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        if text:
            yield text


async def ai_native_evaluate(
    scenario_title: str, scenario_problem: str, ai_conversation: list[dict],
    solution: str, time_taken_minutes: int,
) -> dict:
    formatted_convo = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in ai_conversation)
    prompt = f"""Problem: {scenario_title}

Full problem statement:
{scenario_problem}

--- AI Assistant Conversation (candidate's prompts and AI responses) ---
{formatted_convo if formatted_convo else "(Candidate did not use the AI assistant)"}

--- Candidate's Final Solution ---
{solution if solution.strip() else "(No solution submitted)"}

Time taken: {time_taken_minutes} minutes

Evaluate this performance."""

    response = await client.chat.completions.create(
        model=MODEL,
        max_tokens=1500,
        messages=_msgs(ai_native_evaluator_system(), [{"role": "user", "content": prompt}]),
    )
    return _parse_json(response.choices[0].message.content)
