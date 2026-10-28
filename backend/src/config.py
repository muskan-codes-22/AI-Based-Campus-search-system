import os
from pathlib import Path
import torch
from dotenv import load_dotenv

# BASE_DIR points to backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from backend/ or project root
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env", override=True)

_data_raw = os.getenv("DATA_DIR", "data")
DATA_DIR = Path(_data_raw) if Path(_data_raw).is_absolute() else (BASE_DIR / _data_raw).resolve()
_chroma_raw = os.getenv("CHROMA_DIR", "chroma_db")
CHROMA_DIR = Path(_chroma_raw) if Path(_chroma_raw).is_absolute() else (BASE_DIR / _chroma_raw).resolve()
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "pdf_knowledge_base")

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
NVIDIA_MODEL = os.getenv(
    "NVIDIA_MODEL", "nvidia/nemotron-3.5-bolt-e4b"
)

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "700"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
VECTOR_TOP_K = int(os.getenv("VECTOR_TOP_K", "6"))
BM25_TOP_K = int(os.getenv("BM25_TOP_K", "6"))
FINAL_TOP_K = int(os.getenv("FINAL_TOP_K", "5"))
RRF_K = int(os.getenv("RRF_K", "60"))
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "14000"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)


def choose_embedding_device() -> str:
    """Use CUDA when PyTorch can see a CUDA GPU; otherwise use CPU."""
    try:
        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass
    return "cpu"
