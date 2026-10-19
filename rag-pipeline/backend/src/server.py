import datetime
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .config import DATA_DIR, COLLECTION_NAME
    from .vector_store import get_vector_store
    from .retrieval import HybridRetriever
    from .generation import create_llm, answer_question
    from .ingest import ingest_pdf, delete_document_from_store
except ImportError:
    from config import DATA_DIR, COLLECTION_NAME
    from vector_store import get_vector_store
    from retrieval import HybridRetriever
    from generation import create_llm, answer_question
    from ingest import ingest_pdf, delete_document_from_store


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[dict]] = None


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
        print("[startup] LLM initialized successfully.")
    except Exception as exc:
        print(f"[startup warning] LLM initialization deferred or failed: {exc}")
        llm = None

    app.state.store = store
    app.state.retriever = retriever
    app.state.llm = llm

    yield

    print("[shutdown] Closing connections...")


app = FastAPI(
    title="RAG Pipeline API",
    description="FastAPI Backend for Document Question Answering and Indexing",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    has_llm = app.state.llm is not None
    return {
        "status": "healthy",
        "llm_ready": has_llm,
        "collection": COLLECTION_NAME,
    }


@app.get("/api/stats")
def get_stats():
    store = app.state.store
    try:
        data = store.get(include=["metadatas"])
        metadatas = data.get("metadatas") or []
        chunk_count = len(metadatas)

        # Unique document files
        filenames = set()
        for meta in metadatas:
            fn = meta.get("source_filename")
            if fn:
                filenames.add(fn)

        doc_count = len(filenames)
    except Exception as exc:
        print(f"[error] Could not calculate stats: {exc}")
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
        print(f"[error] Could not load document metadatas from store: {exc}")

    # Cross-reference with files on disk in DATA_DIR
    for file_path in DATA_DIR.glob("*.*"):
        if file_path.is_file() and not file_path.name.startswith("."):
            fn = file_path.name
            mtime = datetime.datetime.fromtimestamp(file_path.stat().st_mtime)
            formatted_date = mtime.strftime("%b %d, %Y")

            if fn in documents_map:
                documents_map[fn]["uploaded"] = formatted_date
            else:
                documents_map[fn] = {
                    "name": fn,
                    "uploaded": formatted_date,
                    "chunks": 0,
                    "status": "Pending" if fn.lower().endswith(".pdf") else "Unsupported",
                }

    return list(documents_map.values())


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    retriever: HybridRetriever = app.state.retriever
    llm = app.state.llm

    # Re-initialize LLM if it wasn't ready at startup
    if llm is None:
        try:
            llm = create_llm()
            app.state.llm = llm
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"NVIDIA LLM not configured: {exc}"
            )

    try:
        docs = retriever.invoke(question)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval error: {exc}"
        )

    sources = []
    seen = set()
    for doc in docs:
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

    try:
        answer = answer_question(llm, question, docs, history=request.history)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Generation error: {exc}"
        )

    return ChatResponse(answer=answer, sources=sources)


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

        # Ingest PDF files
        if target_path.suffix.lower() == ".pdf":
            try:
                count, status = ingest_pdf(target_path, store)
                results.append({
                    "name": file.filename,
                    "uploaded": datetime.datetime.now().strftime("%b %d, %Y"),
                    "chunks": count,
                    "status": "Indexed" if count > 0 else "Empty",
                })
            except Exception as exc:
                print(f"[error] Failed to ingest {file.filename}: {exc}")
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

    # Reload retriever index
    try:
        retriever.reload()
    except Exception as exc:
        print(f"[warning] Retriever reload error: {exc}")

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
            print(f"[warning] Could not remove file {filename} from disk: {exc}")

    try:
        retriever.reload()
    except Exception as exc:
        print(f"[warning] Retriever reload error: {exc}")

    return {
        "success": True,
        "filename": filename,
        "deleted_chunks": deleted_chunks,
    }
