import os
import asyncpg
from app.services.embeddings import embed, embed_many

# Module-level pool — created once at startup via lifespan in main.py
_pool: asyncpg.Pool | None = None


async def init_pool():
    global _pool
    _pool = await asyncpg.create_pool(
        os.getenv("DATABASE_URL"),
        min_size=2,
        max_size=10,
    )


async def close_pool():
    if _pool:
        await _pool.close()


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized. Was lifespan called?")
    return _pool


async def save_attempt(
    user_id: str,
    problem_id: str,
    reasoning: str,
    embedding: list[float],
):
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with get_pool().acquire() as conn:
        await conn.execute(
            """
            INSERT INTO "DSAAttempt" (id, "userId", "problemId", reasoning, embedding, "createdAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, now())
            """,
            user_id,
            problem_id,
            reasoning,
            vector_str,
        )


async def similar_attempts(
    user_id: str,
    embedding: list[float],
    limit: int = 5,
) -> list[dict]:
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with get_pool().acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT reasoning, 1 - (embedding::vector <=> $1::vector) AS similarity
            FROM "DSAAttempt"
            WHERE "userId" = $2
              AND embedding IS NOT NULL
            ORDER BY embedding::vector <=> $1::vector
            LIMIT $3
            """,
            vector_str,
            user_id,
            limit,
        )
        return [dict(r) for r in rows]


async def save_job_embedding(job_id: str, description: str):
    embedding = await embed(description)
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    async with get_pool().acquire() as conn:
        await conn.execute(
            """
            UPDATE "Job"
            SET embedding = $1::vector
            WHERE id = $2
            """,
            vector_str,
            job_id,
        )


async def match_jobs(user_embedding: list[float], limit: int = 20) -> list[dict]:
    vector_str = "[" + ",".join(str(x) for x in user_embedding) + "]"
    async with get_pool().acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, company, location, url, tags,
                   1 - (embedding::vector <=> $1::vector) AS similarity
            FROM "Job"
            WHERE embedding IS NOT NULL
            ORDER BY embedding::vector <=> $1::vector
            LIMIT $2
            """,
            vector_str,
            limit,
        )
        return [dict(r) for r in rows]