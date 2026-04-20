import os
import asyncpg
from app.services.embeddings import embed, embed_many


async def get_conn():
    return await asyncpg.connect(os.getenv("DATABASE_URL"))


# async def save_attempt(
#     user_id: str,
#     problem_id: str,
#     reasoning: str,
#     embedding: list[float],
# ):
#     conn = await get_conn()
#     try:
#         await conn.execute(
#             """
#             INSERT INTO "DSAAttempt" (id, "userId", "problemId", reasoning, embedding, "createdAt")
#             VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, now())
#             """,
#             user_id,
#             problem_id,
#             reasoning,
#             str(embedding),
#         )
#     finally:
#         await conn.close()


# async def similar_attempts(
#     user_id: str,
#     embedding: list[float],
#     limit: int = 5,
# ) -> list[dict]:
#     conn = await get_conn()
#     try:
#         rows = await conn.fetch(
#             """
#             SELECT reasoning, 1 - (embedding <=> $1::vector) AS similarity
#             FROM "DSAAttempt"
#             WHERE "userId" = $2
#               AND embedding IS NOT NULL
#             ORDER BY embedding <=> $1::vector
#             LIMIT $3
#             """,
#             str(embedding),
#             user_id,
#             limit,
#         )
#         return [dict(r) for r in rows]
#     finally:
#         await conn.close()

async def save_attempt(
    user_id: str,
    problem_id: str,
    reasoning: str,
    embedding: list[float],
):
    conn = await get_conn()
    try:
        await conn.execute(
            """
            INSERT INTO "DSAAttempt" (id, "userId", "problemId", reasoning, embedding, "createdAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, now())
            """,
            user_id,
            problem_id,
            reasoning,
            "[" + ",".join(str(x) for x in embedding) + "]",
        )
    finally:
        await conn.close()


async def similar_attempts(
    user_id: str,
    embedding: list[float],
    limit: int = 5,
) -> list[dict]:
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    conn = await get_conn()
    try:
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
    finally:
        await conn.close()

# async def save_job_embedding(job_id: str, description: str):
#     embedding = await embed(description)
#     conn = await get_conn()
#     try:
#         await conn.execute(
#             """
#             UPDATE "Job"
#             SET embedding = $1::vector
#             WHERE id = $2
#             """,
#             str(embedding),
#             job_id,
#         )
#     finally:
#         await conn.close()


# async def match_jobs(user_embedding: list[float], limit: int = 20) -> list[dict]:
#     conn = await get_conn()
#     try:
#         rows = await conn.fetch(
#             """
#             SELECT id, title, company, location, url, tags,
#                    1 - (embedding <=> $1::vector) AS similarity
#             FROM "Job"
#             WHERE embedding IS NOT NULL
#             ORDER BY embedding <=> $1::vector
#             LIMIT $2
#             """,
#             str(user_embedding),
#             limit,
#         )
#         return [dict(r) for r in rows]
#     finally:
#         await conn.close()

async def save_job_embedding(job_id: str, description: str):
    embedding = await embed(description)
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
    conn = await get_conn()
    try:
        await conn.execute(
            """
            UPDATE "Job"
            SET embedding = $1::vector
            WHERE id = $2
            """,
            vector_str,
            job_id,
        )
    finally:
        await conn.close()


async def match_jobs(user_embedding: list[float], limit: int = 20) -> list[dict]:
    vector_str = "[" + ",".join(str(x) for x in user_embedding) + "]"
    conn = await get_conn()
    try:
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
    finally:
        await conn.close()