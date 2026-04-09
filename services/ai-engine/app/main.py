from fastapi import FastAPI

app = FastAPI(title="BTP AI Engine")

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-engine"}