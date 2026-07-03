import asyncio
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ExecuteFile(BaseModel):
    name: str
    content: str


class ExecuteRequest(BaseModel):
    language: str
    version: str
    files: list[ExecuteFile]


@router.post("/piston/execute")
async def execute(payload: ExecuteRequest):
    code = "\n".join(f.content for f in payload.files)
    try:
        proc = await asyncio.create_subprocess_exec(
            "python3", "-c", code,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
        return {
            "run": {
                "stdout": stdout.decode(),
                "stderr": stderr.decode(),
                "code": proc.returncode,
            }
        }
    except asyncio.TimeoutError:
        return {
            "run": {
                "stdout": "",
                "stderr": "Execution timed out (10s limit)",
                "code": 1,
            }
        }
