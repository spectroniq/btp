# Learning Notes — AI Engine

Things I learned and concepts I should understand after building this service.

---

## FastAPI

### Async vs Sync — this matters a lot

FastAPI runs on an async event loop (via `uvicorn` + `asyncio`). This means:

- Any function declared `async def` runs on the event loop
- If you call a **blocking/synchronous** function inside an `async def`, you freeze the entire server until it returns — no other requests can be handled

```python
# BAD — blocks the event loop
async def embed(text: str):
    result = voyageai.Client().embed([text])  # synchronous call inside async!
    return result.embeddings[0]

# GOOD — hands the blocking work off to a thread pool
async def embed(text: str):
    result = await asyncio.to_thread(vo.embed, [text], model="voyage-3")
    return result.embeddings[0]
```

`asyncio.to_thread()` runs the sync function in a background thread and awaits it — the event loop is free while it works.

### Lifespan — startup and shutdown hooks

FastAPI's `lifespan` context manager is the right way to set up resources that live for the whole app lifetime (DB pools, ML models, etc.):

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()   # runs once at startup
    yield               # app is alive here
    await close_pool()  # runs once at shutdown

app = FastAPI(lifespan=lifespan)
```

The old way was `@app.on_event("startup")` — that's deprecated. Use `lifespan`.

---

## asyncpg — Postgres Driver

### Connection per request = bad

```python
# BAD — opens and closes a TCP connection for every single request
async def get_conn():
    return await asyncpg.connect(DATABASE_URL)
```

Opening a DB connection takes ~10–50ms and involves a TCP handshake + auth. Doing this on every request is slow and can exhaust your DB's connection limit under load.

### Connection pool = good

```python
# GOOD — create a pool once, reuse connections
pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)

# In each handler:
async with pool.acquire() as conn:
    rows = await conn.fetch("SELECT ...")
```

`pool.acquire()` checks out an existing connection (or waits for one to free up). `min_size` keeps warm connections alive; `max_size` caps how many simultaneous queries you can run.

---

## pgvector — Vector Similarity Search

This is a Postgres extension that adds a `vector` column type and similarity operators.

- `<=>` = cosine distance (lower = more similar)
- `1 - (a <=> b)` = cosine similarity score (higher = more similar)
- You need to cast the stored string to `::vector` explicitly when using asyncpg

```sql
SELECT reasoning, 1 - (embedding::vector <=> $1::vector) AS similarity
FROM "DSAAttempt"
ORDER BY embedding::vector <=> $1::vector
LIMIT 5;
```

The `embedding` column stores vectors as strings (`"[0.1, 0.2, ...]"`) and pgvector casts them at query time.

---

## Anthropic (Claude) API

### Model naming matters

Model names follow a specific versioned format: `claude-{family}-{version}-{YYYYMMDD}`.

Examples:
- `claude-3-5-sonnet-20241022` ✅
- `claude-sonnet-4-20250514` ❌ (this model doesn't exist yet)

Always check [Anthropic's model docs](https://docs.anthropic.com/en/docs/about-claude/models) before using a model name.

### System prompts vs user messages

Claude uses a `system` parameter (separate from `messages`) for the persistent instruction set:

```python
client.messages.create(
    model="claude-3-5-sonnet-20241022",
    system="You are a Socratic DSA coach...",   # persists across conversation
    messages=[
        {"role": "user", "content": "Here is my reasoning..."}
    ]
)
```

### Stateless API — you send full history each time

Claude has no memory between requests. For multi-turn conversations (like the interview feature), you must pass the entire `history` list on every call. The frontend or session store owns the state.

---

## Voyage AI — Embeddings

Voyage AI produces dense vector embeddings — numerical representations of text where similar meanings = similar vectors (close in vector space).

This is what powers the "past reasoning patterns" feature:
1. User submits reasoning → embed it into a 1024-dim vector
2. Query pgvector for the most similar past attempts by that user
3. Feed those patterns into Claude's prompt as context

```python
result = vo.embed(["user's reasoning text"], model="voyage-3")
vector = result.embeddings[0]  # list[float], ~1024 dimensions
```

The `voyage-3` model is optimized for retrieval tasks (semantic search).

---

## Mistakes I Made & Fixed

| Bug | Why it was wrong | Fix |
|-----|-----------------|-----|
| `model="claude-sonnet-4-20250514"` | That model name doesn't exist — would throw at runtime | Changed to `claude-3-5-sonnet-20241022` |
| Calling `voyageai.Client()` inside `async def` | Synchronous call blocks the entire event loop | Wrapped with `asyncio.to_thread()` |
| `asyncpg.connect()` per request | Creates+destroys a TCP connection on every request — slow and unscalable | Replaced with `asyncpg.create_pool()` + `pool.acquire()` |
| `langchain` in dependencies | Imported but never used anywhere in the codebase | Removed from `pyproject.toml` |
| `models/` directory empty | Pydantic models scattered in route files — will get messy | Future: move request/response models here |

---

## Architecture Pattern: Memory-Augmented Coaching

The core loop in `/v1/dsa/reason`:

```
User reasoning
    → embed (Voyage AI)
    → similarity search (pgvector) → past patterns
    → combine into Claude prompt
    → Claude coaching response
    → save embedding (for future sessions)
```

This means the coach gets *personalized* over time — it can reference "you tend to jump to O(n²) before thinking about the data structure" based on actual saved attempts.
