"""
IRS Copilot — FastAPI Backend

Exposes the RAG chatbot as a streaming SSE API so any frontend can consume it.

Run with:
    poetry run uvicorn api:app --reload --port 8000
"""

import json
import textwrap

import chromadb
from anthropic import Anthropic
from chromadb.utils import embedding_functions
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from constants import (
    CHAT_DIR,
    CHROMA_DIR,
    CLAUDE_MODEL,
    COLLECTION_NAME,
    EMBED_MODEL,
    MAX_HISTORY,
    REPO_ROOT,
    SYSTEM_PROMPT,
    TOP_K,
)


load_dotenv(REPO_ROOT / ".env")
load_dotenv(CHAT_DIR / ".env")


app = FastAPI(title="IRS Copilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_collection = None


def get_collection():
    global _collection
    if _collection is not None:
        return _collection
    if not CHROMA_DIR.exists():
        return None
    try:
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBED_MODEL
        )
        _collection = client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=embed_fn,
        )
        return _collection
    except Exception:
        return None


def retrieve_context(collection, query: str, top_k: int = TOP_K) -> list[dict]:
    results = collection.query(
        query_texts=[query],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({"text": doc, "metadata": meta, "score": 1 - dist})
    return chunks


def build_context_block(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk["metadata"]
        source_label = {
            "form_summary": f"IRS Form Summary — {meta.get('form', 'unknown')}",
            "irs_form": f"IRS Form — {meta.get('form', 'unknown')}",
            "form_instructions": f"Form Instructions — {meta.get('form', 'unknown')}",
            "form_instructions_combined": f"Form & Instructions — {meta.get('form', 'unknown')}",
            "irs_publication": f"IRS Publication — {meta.get('publication', 'unknown')}",
            "prompt_example": f"Tax Scenario Example — {meta.get('scenario', '')}",
            "flow_example": f"Tax Workflow — {meta.get('flow', '')}",
        }.get(meta.get("source", ""), meta.get("file", ""))
        parts.append(f"[Source {i}: {source_label}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


class HistoryMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []
    top_k: int = TOP_K
    api_key: str


@app.get("/api/health")
def health():
    collection = get_collection()
    if collection is None:
        return {"status": "no_index", "doc_count": 0}
    return {"status": "ok", "doc_count": collection.count()}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    collection = get_collection()
    if collection is None:
        raise HTTPException(status_code=503, detail="Knowledge base not indexed yet.")

    if not req.api_key:
        raise HTTPException(status_code=400, detail="api_key is required.")

    async def generate():
        chunks = retrieve_context(collection, req.message, top_k=req.top_k)
        context_block = build_context_block(chunks)

        user_content = textwrap.dedent(f"""
            ## Retrieved IRS Knowledge Base Context

            {context_block}

            ---

            ## Question

            {req.message}
        """).strip()

        history_payload = [
            {"role": m.role, "content": m.content} for m in req.history[-MAX_HISTORY * 2:]
        ]
        messages_payload = history_payload + [{"role": "user", "content": user_content}]

        client = Anthropic(api_key=req.api_key)
        try:
            with client.messages.stream(
                model=CLAUDE_MODEL,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=messages_payload,
            ) as stream:
                for text_chunk in stream.text_stream:
                    yield {
                        "data": json.dumps({"type": "text", "content": text_chunk})
                    }
        except Exception as e:
            yield {"data": json.dumps({"type": "error", "message": str(e)})}
            return

        sources = [
            {
                "text": c["text"][:600],
                "metadata": c["metadata"],
                "score": round(c["score"], 3),
            }
            for c in chunks
        ]
        yield {"data": json.dumps({"type": "sources", "sources": sources})}
        yield {"data": json.dumps({"type": "done"})}

    return EventSourceResponse(generate())
