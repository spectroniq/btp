import os
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def embed(text: str) -> list[float]:
    return await _voyage_embed(text)


async def _voyage_embed(text: str) -> list[float]:
    import voyageai
    vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))
    result = vo.embed([text], model="voyage-3")
    return result.embeddings[0]


async def embed_many(texts: list[str]) -> list[list[float]]:
    import voyageai
    vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))
    result = vo.embed(texts, model="voyage-3")
    return result.embeddings