import os
import asyncio
import voyageai

# Instantiate once — the Voyage client is thread-safe
_vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))


async def embed(text: str) -> list[float]:
    """Embed a single string. Runs the blocking Voyage call off the event loop."""
    result = await asyncio.to_thread(_vo.embed, [text], model="voyage-3")
    return result.embeddings[0]


async def embed_many(texts: list[str]) -> list[list[float]]:
    """Embed a batch of strings. Runs the blocking Voyage call off the event loop."""
    result = await asyncio.to_thread(_vo.embed, texts, model="voyage-3")
    return result.embeddings