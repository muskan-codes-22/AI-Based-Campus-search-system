import sys
from pathlib import Path
import uvicorn

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "src"))

if __name__ == "__main__":
    print("Starting RAG Pipeline FastAPI backend on http://127.0.0.1:8000 ...")
    uvicorn.run("src.server:app", host="127.0.0.1", port=8000, reload=True)
