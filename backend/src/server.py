import datetime
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

try:
    from .config import DATA_DIR, COLLECTION_NAME, NVIDIA_MODEL
    from .vector_store import get_vector_store
    from .retrieval import HybridRetriever
    from .generation import create_llm, answer_question, stream_answer_question, ALLOWED_MODES
    from .ingest import ingest_file, delete_document_from_store, SUPPORTED_EXTENSIONS
    from .db import list_sessions, create_session, delete_session, get_session_messages, add_message
except ImportError:
    from config import DATA_DIR, COLLECTION_NAME, NVIDIA_MODEL
    from vector_store import get_vector_store
    from retrieval import HybridRetriever
    from generation import create_llm, answer_question, stream_answer_question, ALLOWED_MODES
    from ingest import ingest_file, delete_document_from_store, SUPPORTED_EXTENSIONS
    from db import list_sessions, create_session, delete_session, get_session_messages, add_message

logger = logging.getLogger(__name__)

# In-memory query cache: up to 250 items, cached for 1 hour (3600s)
query_cache = TTLCache(maxsize=250, ttl=3600)


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = None
    answer_mode: Optional[str] = "auto"
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize store, retriever, and LLM
    print("[startup] Initializing Chroma vector store and HybridRetriever...")
    store = get_vector_store()
    retriever = HybridRetriever(store)

    print("[startup] Initializing LLM...")
    try:
        llm = create_llm()
        print(f"[startup] LLM initialized successfully with model: {NVIDIA_MODEL}")
    except Exception as exc:
        print(f"[startup warning] LLM initialization deferred: {exc}")
        llm = None

    app.state.store = store
    app.state.retriever = retriever
    app.state.llm = llm

    yield

    print("[shutdown] Closing connections...")


app = FastAPI(
    title="Campus Multimodal RAG API",
    description="Multimodal College Search & Exam Assistant API with Hybrid Search and Fast Streaming",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    store = app.state.store
    has_llm = app.state.llm is not None
    return {
        "status": "healthy",
        "llm_ready": has_llm,
        "model": NVIDIA_MODEL,
        "collection": COLLECTION_NAME,
        "supported_extensions": list(SUPPORTED_EXTENSIONS),
    }


@app.get("/api/stats")
def get_stats():
    store = app.state.store
    try:
        data = store.get(include=["metadatas"])
        metadatas = data.get("metadatas") or []
        chunk_count = len(metadatas)

        filenames = set()
        for meta in metadatas:
            fn = meta.get("source_filename")
            if fn:
                filenames.add(fn)

        doc_count = len(filenames)
    except Exception as exc:
        logger.error(f"Could not calculate stats: {exc}")
        doc_count = 0
        chunk_count = 0

    return {
        "doc_count": doc_count,
        "chunk_count": chunk_count,
        "collection_name": COLLECTION_NAME,
    }


@app.get("/api/documents")
def list_documents():
    store = app.state.store
    documents_map = {}

    try:
        data = store.get(include=["metadatas"])
        metadatas = data.get("metadatas") or []

        for meta in metadatas:
            fn = meta.get("source_filename")
            if not fn:
                continue

            if fn not in documents_map:
                documents_map[fn] = {
                    "name": fn,
                    "uploaded": "Indexed",
                    "chunks": 0,
                    "status": "Indexed",
                }
            documents_map[fn]["chunks"] += 1
    except Exception as exc:
        logger.error(f"Could not load document metadatas from store: {exc}")

    # Cross-reference with files on disk in DATA_DIR
    for file_path in DATA_DIR.glob("*.*"):
        if file_path.is_file() and not file_path.name.startswith("."):
            fn = file_path.name
            mtime = datetime.datetime.fromtimestamp(file_path.stat().st_mtime)
            formatted_date = mtime.strftime("%b %d, %Y")
            is_supported = file_path.suffix.lower() in SUPPORTED_EXTENSIONS

            if fn in documents_map:
                documents_map[fn]["uploaded"] = formatted_date
            else:
                documents_map[fn] = {
                    "name": fn,
                    "uploaded": formatted_date,
                    "chunks": 0,
                    "status": "Pending" if is_supported else "Unsupported",
                }

    return list(documents_map.values())


def _compute_doc_attribution(doc_text: str, answer_text: str) -> int:
    """Score how strongly a retrieved document actually contributed to the generated answer."""
    ans_clean = answer_text.lower()
    doc_clean = doc_text.lower()

    stopwords = {
        "this", "that", "with", "from", "have", "what", "which", "when", "where",
        "your", "about", "some", "than", "will", "would", "could", "should", "their",
        "there", "these", "those", "other", "into", "also", "only", "then", "been",
        "select", "choose", "correct", "option", "following", "questions", "answer",
        "multiple", "choice", "data", "based", "short", "long"
    }
    ans_words = set(re.findall(r"[a-zA-Z0-9]{4,}", ans_clean)) - stopwords
    doc_words = set(re.findall(r"[a-zA-Z0-9]{4,}", doc_clean)) - stopwords
    common_words = ans_words.intersection(doc_words)

    # 3-word phrase matching
    ans_tokens = re.findall(r"\b\w+\b", ans_clean)
    ans_trigrams = set(" ".join(ans_tokens[i:i+3]) for i in range(len(ans_tokens) - 2))
    doc_tokens = re.findall(r"\b\w+\b", doc_clean)
    doc_trigrams = set(" ".join(doc_tokens[i:i+3]) for i in range(len(doc_tokens) - 2))
    common_trigrams = ans_trigrams.intersection(doc_trigrams)

    return len(common_words) + 5 * len(common_trigrams)


def _extract_source_previews(docs, answer: Optional[str] = None) -> List[dict]:
    """
    Extract source previews, strictly filtering out noisy documents so that
    only documents actually used or cited in the answer are shown to the user.
    """
    if not docs:
        return []

    target_docs = docs
    if answer and answer.strip():
        ans_clean = answer.lower()
        scored_docs = []
        for doc in docs:
            fn = doc.metadata.get("source_filename", "").lower()
            score = _compute_doc_attribution(doc.page_content, answer)
            # If the filename was explicitly cited in the answer, grant high score
            if fn and fn in ans_clean:
                score += 50
            scored_docs.append((doc, score))

        if scored_docs:
            max_score = max(score for _, score in scored_docs)
            if "not found in the indexed material" in ans_clean and len(ans_clean.strip()) < 200:
                target_docs = []
            elif max_score >= 10:
                # Keep only docs that have meaningful contribution (at least 35% of peak score)
                min_threshold = max(8, int(max_score * 0.35))
                target_docs = [doc for doc, score in scored_docs if score >= min_threshold]
            elif max_score >= 5:
                target_docs = [doc for doc, score in scored_docs if score >= 5]
            else:
                target_docs = []

    sources = []
    seen = set()
    for doc in target_docs:
        filename = doc.metadata.get("source_filename", "Document")
        page = doc.metadata.get("page_number", 1)
        key = (filename, page)
        if key in seen:
            continue
        seen.add(key)

        preview = doc.page_content.strip()[:180].replace("\n", " ")
        sources.append({
            "file": filename,
            "page": page,
            "excerpt": preview,
        })
    return sources[:6]


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    retriever: HybridRetriever = app.state.retriever
    llm = app.state.llm

    if llm is None or getattr(llm, "model", None) != NVIDIA_MODEL:
        try:
            llm = create_llm()
            app.state.llm = llm
        except Exception as exc:
            if llm is None:
                raise HTTPException(status_code=500, detail=f"NVIDIA LLM not configured: {exc}")

    mode = request.answer_mode if request.answer_mode in ALLOWED_MODES else "auto"
    cache_key = f"{mode}:{question.lower()}"

    # Check in-memory cache
    if cache_key in query_cache:
        cached_result = query_cache[cache_key]
        return ChatResponse(answer=cached_result["answer"], sources=cached_result["sources"])

    try:
        docs = retriever.invoke(question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {exc}")

    try:
        answer = answer_question(
            llm,
            question,
            docs,
            history=request.history,
            answer_mode=mode,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation error: {exc}")

    sources = _extract_source_previews(docs, answer=answer)

    # Cache successful answer
    query_cache[cache_key] = {"answer": answer, "sources": sources}

    return ChatResponse(answer=answer, sources=sources)


@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Streams token events in real time, then emits grounded sources upon completion.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    retriever: HybridRetriever = app.state.retriever
    llm = app.state.llm

    if llm is None or getattr(llm, "model", None) != NVIDIA_MODEL:
        try:
            llm = create_llm()
            app.state.llm = llm
        except Exception as exc:
            if llm is None:
                raise HTTPException(status_code=500, detail=f"NVIDIA LLM not configured: {exc}")

    mode = request.answer_mode if request.answer_mode in ALLOWED_MODES else "auto"
    cache_key = f"{mode}:{question.lower()}"

    try:
        docs = retriever.invoke(question)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {exc}")

    async def event_generator():
        # 1. Check cache
        if cache_key in query_cache:
            cached_data = query_cache[cache_key]
            yield f"event: sources\ndata: {json.dumps(cached_data['sources'])}\n\n"
            yield f"event: token\ndata: {json.dumps({'delta': cached_data['answer']})}\n\n"
            yield "event: done\ndata: {}\n\n"
            return

        # 2. Stream generated tokens
        accumulated_chunks = []
        try:
            async for token in stream_answer_question(
                llm,
                question,
                docs,
                history=request.history,
                answer_mode=mode,
            ):
                accumulated_chunks.append(token)
                yield f"event: token\ndata: {json.dumps({'delta': token})}\n\n"
        except Exception as exc:
            logger.error(f"Error in stream generation: {exc}")
            err_msg = f"Generation error: {exc}"
            yield f"event: token\ndata: {json.dumps({'delta': err_msg})}\n\n"

        full_answer = "".join(accumulated_chunks).strip()
        # 3. Grounded source attribution: filter only the sources used in the answer
        grounded_sources = _extract_source_previews(docs, answer=full_answer)
        yield f"event: sources\ndata: {json.dumps(grounded_sources)}\n\n"

        if full_answer:
            query_cache[cache_key] = {"answer": full_answer, "sources": grounded_sources}
            try:
                session_id = request.session_id or "default"
                add_message(session_id, "user", question)
                add_message(session_id, "assistant", full_answer, grounded_sources)
            except Exception as exc:
                logger.warning(f"Failed to record stream message: {exc}")

        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/upload")
async def upload_endpoint(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    store = app.state.store
    retriever: HybridRetriever = app.state.retriever
    results = []

    for file in files:
        target_path = DATA_DIR / file.filename

        # Write uploaded file to disk
        try:
            content = await file.read()
            with open(target_path, "wb") as f:
                f.write(content)
        except Exception as exc:
            results.append({
                "name": file.filename,
                "uploaded": datetime.datetime.now().strftime("%b %d, %Y"),
                "chunks": 0,
                "status": "Failed",
                "error": str(exc),
            })
            continue

        # Ingest supported files (PDF, Word, PPTX, Excel, CSV, Text)
        ext = target_path.suffix.lower()
        if ext in SUPPORTED_EXTENSIONS:
            try:
                count, status = ingest_file(target_path, store)
                results.append({
                    "name": file.filename,
                    "uploaded": datetime.datetime.now().strftime("%b %d, %Y"),
                    "chunks": count,
                    "status": "Indexed" if count > 0 else "Empty",
                })
            except Exception as exc:
                logger.error(f"Failed to ingest {file.filename}: {exc}")
                results.append({
                    "name": file.filename,
                    "uploaded": datetime.datetime.now().strftime("%b %d, %Y"),
                    "chunks": 0,
                    "status": "Failed",
                    "error": str(exc),
                })
        else:
            results.append({
                "name": file.filename,
                "uploaded": datetime.datetime.now().strftime("%b %d, %Y"),
                "chunks": 0,
                "status": "Unsupported",
            })

    # Clear query cache when new files are added
    query_cache.clear()

    # Reload retriever index
    try:
        retriever.reload()
    except Exception as exc:
        logger.warning(f"Retriever reload error: {exc}")

    return results


@app.delete("/api/documents/{filename}")
def delete_document(filename: str):
    store = app.state.store
    retriever: HybridRetriever = app.state.retriever

    deleted_chunks = delete_document_from_store(filename, store)

    file_path = DATA_DIR / filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as exc:
            logger.warning(f"Could not remove file {filename} from disk: {exc}")

    # Clear query cache when documents are deleted
    query_cache.clear()

    try:
        retriever.reload()
    except Exception as exc:
        logger.warning(f"Retriever reload error: {exc}")

    return {
        "success": True,
        "filename": filename,
        "deleted_chunks": deleted_chunks,
    }


class SessionCreateRequest(BaseModel):
    title: Optional[str] = "New Study Session"
    user_name: Optional[str] = "Student"


@app.get("/api/sessions")
def get_sessions_endpoint():
    return list_sessions()


@app.post("/api/sessions")
def create_session_endpoint(req: SessionCreateRequest):
    import uuid
    session_id = f"session_{uuid.uuid4().hex[:8]}"
    return create_session(session_id, title=req.title or "New Study Session", user_name=req.user_name or "Student")


@app.get("/api/sessions/{session_id}/messages")
def get_messages_endpoint(session_id: str):
    return get_session_messages(session_id)


@app.delete("/api/sessions/{session_id}")
def delete_session_endpoint(session_id: str):
    delete_session(session_id)
    return {"success": True, "session_id": session_id}

