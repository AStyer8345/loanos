"""
LoanOS NotebookLM Bridge — FastAPI microservice

Wraps notebooklm-py and exposes a simple HTTP API so the Next.js
chat route can call it as a Claude tool.

Run:
  source .venv/bin/activate
  uvicorn main:app --port 8001 --reload
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from notebooklm import NotebookLMClient
from notebooklm.exceptions import NotebookLMError, AuthError

# ── Config ──────────────────────────────────────────────────────────────────
NOTEBOOK_ID = os.environ.get("NOTEBOOKLM_NOTEBOOK_ID", "3489e177-98de-4271-bbb8-d19145415718")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("notebooklm-service")

# ── Shared client ────────────────────────────────────────────────────────────
# We keep a single NotebookLMClient alive for the server's lifetime so each
# request reuses the authenticated session instead of re-authenticating.
_client: Optional[NotebookLMClient] = None
_client_lock = asyncio.Lock()


def _ensure_storage_state():
    """If NOTEBOOKLM_STORAGE_STATE env var is set (base64 or JSON), write it to
    the default path so from_storage() can find it."""
    env_val = os.environ.get("NOTEBOOKLM_STORAGE_STATE")
    if not env_val:
        logger.warning("NOTEBOOKLM_STORAGE_STATE env var is not set")
        return
    logger.info("NOTEBOOKLM_STORAGE_STATE env var found (%d chars)", len(env_val))
    storage_dir = Path.home() / ".notebooklm"
    storage_dir.mkdir(parents=True, exist_ok=True)
    storage_path = storage_dir / "storage_state.json"
    if storage_path.exists():
        logger.info("storage_state.json already exists, skipping")
        return
    try:
        import base64
        data = base64.b64decode(env_val, validate=True)
        storage_path.write_bytes(data)
        logger.info("Wrote storage_state.json from base64 (%d bytes)", len(data))
    except Exception as e:
        logger.warning("Base64 decode failed (%s), trying raw write", e)
        storage_path.write_text(env_val)
        logger.info("Wrote storage_state.json as raw text")


async def get_client() -> NotebookLMClient:
    global _client
    if _client is not None:
        return _client
    async with _client_lock:
        if _client is None:
            _ensure_storage_state()
            logger.info("Initialising NotebookLM client from saved auth...")
            instance = await NotebookLMClient.from_storage(timeout=120.0)
            _client = await instance.__aenter__()
            logger.info("NotebookLM client ready (notebook: %s)", NOTEBOOK_ID)
    return _client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly start the client so the first request isn't slow
    try:
        await get_client()
    except AuthError:
        logger.warning(
            "No saved auth found. Run `notebooklm auth login` then restart this service."
        )
    except Exception as e:
        logger.warning("Could not initialise NotebookLM client on startup: %s", e)
    yield
    # Cleanup — close the HTTP session on shutdown
    global _client
    if _client is not None:
        try:
            await _client.__aexit__(None, None, None)
        except Exception:
            pass
        _client = None
        logger.info("NotebookLM client closed.")


# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LoanOS NotebookLM Bridge",
    description="Exposes the NotebookLM mortgage knowledge base as a simple HTTP API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None  # for follow-up questions in the same session


class QueryResponse(BaseModel):
    answer: str
    conversation_id: str
    sources: list[str] = []


class AddSourceRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None
    title: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    notebook_id: str
    client_ready: bool


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    storage_path = Path.home() / ".notebooklm" / "storage_state.json"
    env_set = bool(os.environ.get("NOTEBOOKLM_STORAGE_STATE"))
    return {
        "status": "ok",
        "notebook_id": NOTEBOOK_ID,
        "client_ready": _client is not None,
        "storage_file_exists": storage_path.exists(),
        "env_var_set": env_set,
        "env_var_len": len(os.environ.get("NOTEBOOKLM_STORAGE_STATE", "")),
        "home_dir": str(Path.home()),
    }


@app.post("/query", response_model=QueryResponse)
async def query_knowledge_base(req: QueryRequest):
    """
    Ask the mortgage knowledge base a question.
    Pass conversation_id from a previous response to ask follow-up questions.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question must not be empty")

    try:
        client = await get_client()
    except AuthError:
        raise HTTPException(
            status_code=503,
            detail="NotebookLM auth not configured. Run `notebooklm auth login` and restart.",
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Client unavailable: {e}")

    try:
        logger.info("Query: %s", req.question[:80])
        result = await client.chat.ask(
            NOTEBOOK_ID,
            req.question,
            conversation_id=req.conversation_id or None,
        )
        logger.info("Answer received (%d chars, conv=%s)", len(result.answer), result.conversation_id)

        # Deduplicate source IDs from citation references
        seen: set[str] = set()
        sources: list[str] = []
        for ref in result.references:
            try:
                sid = getattr(ref, "source_id", None)
                if sid and sid not in seen:
                    seen.add(sid)
                    sources.append(str(sid))
            except Exception:
                pass

        return QueryResponse(
            answer=result.answer,
            conversation_id=result.conversation_id,
            sources=sources,
        )

    except NotebookLMError as e:
        logger.error("NotebookLM error: %s", e)
        raise HTTPException(status_code=502, detail=f"NotebookLM error: {e}")
    except Exception as e:
        logger.exception("Unexpected error during query")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/add-source")
async def add_source(req: AddSourceRequest):
    """Add a new source (URL or text) to the notebook."""
    if not req.url and not req.text:
        raise HTTPException(status_code=400, detail="Provide either url or text")

    try:
        client = await get_client()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Client unavailable: {e}")

    try:
        if req.url:
            logger.info("Adding URL source: %s", req.url)
            source = await client.sources.add_url(NOTEBOOK_ID, req.url)
        else:
            logger.info("Adding text source: %s", (req.title or "untitled")[:40])
            source = await client.sources.add_text(
                NOTEBOOK_ID,
                req.text,
                title=req.title or "Pasted content",
            )
        return {"status": "added", "source_id": getattr(source, "id", None)}
    except NotebookLMError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/sources")
async def list_sources():
    """List all sources currently in the notebook."""
    try:
        client = await get_client()
        sources = await client.sources.list(NOTEBOOK_ID)
        return {
            "sources": [
                {
                    "id": getattr(s, "id", None),
                    "title": getattr(s, "title", None),
                    "type": getattr(s, "source_type", None),
                }
                for s in (sources or [])
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
