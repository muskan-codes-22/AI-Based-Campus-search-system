# PDF RAG with Hybrid Search, Persistent Chroma, and GPU/CPU Embeddings

This is a production-inspired starter project, not a fully hardened production service. It uses:
- PDF extraction with PyPDF
- Recursive chunking with page metadata
- Sentence Transformers embeddings
- Automatic CUDA selection with CPU fallback
- Persistent Chroma vector storage
- BM25 keyword retrieval + dense vector retrieval
- Reciprocal Rank Fusion (RRF)
- NVIDIA-hosted LLM for grounded answers
- Basic error handling, document change detection, and source previews

## 1. Create and activate a virtual environment (Windows PowerShell)

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

## 2. Install PyTorch first

The correct PyTorch command depends on your Windows/Python version and CUDA support.
Use the official selector at https://pytorch.org/get-started/locally/ and install
the recommended build. If you install a CPU-only build, the project will use CPU.

Verify GPU availability:

```powershell
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU mode')"
```

A compatible NVIDIA GPU driver and CUDA-enabled PyTorch build are needed for GPU embeddings.
You do not necessarily need to install the full CUDA Toolkit separately.

## 3. Install the remaining packages

```powershell
python -m pip install -r requirements.txt
```

## 4. Configure NVIDIA API key

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the example value with your real `NVIDIA_API_KEY`.
Never commit `.env` or share your API key. The LLM request and retrieved PDF text are sent
to the NVIDIA-hosted endpoint you configure. Do not use hosted inference for confidential
documents unless your data-handling requirements allow it.

If the configured model is unavailable to your account, choose an enabled chat model from
the NVIDIA API Catalog and update `NVIDIA_MODEL` in `.env`.

## 5. Add PDFs and index them

Place PDF files in the `data` folder. Subfolders are also scanned.

```powershell
python ingest.py
```

Run ingestion again after adding or editing a PDF. Unchanged files are skipped; changed
files are re-indexed. The Chroma database is persisted in `chroma_db`.

Scanned/image-only PDFs may produce no text. Add an OCR stage (for example, Tesseract or
a managed document OCR service) if those PDFs are part of your data.

## 6. Ask questions

```powershell
python main.py
```

Type `exit` to quit.

## How hybrid retrieval works

1. BM25 retrieves keyword-matching chunks.
2. Chroma retrieves semantically similar chunks using embeddings.
3. Reciprocal Rank Fusion combines the two rankings.
4. The top chunks are passed to the NVIDIA chat model with source/page metadata.

## GPU behavior

The embedding code checks `torch.cuda.is_available()`. If CUDA is unavailable, it selects
CPU. If GPU model initialization fails, it retries on CPU. GPU acceleration applies to
local embedding generation, not to the NVIDIA-hosted LLM call.

## Important limitations before real production

- BM25 currently loads all indexed chunks into memory when the query app starts. This is
  fine for a learning project or modest corpus, but a large corpus needs a scalable lexical
  index such as OpenSearch/Elasticsearch or a dedicated search service.
- This CLI has no authentication, authorization, web API, or multi-user isolation.
- Add automated retrieval/answer evaluations, structured logs, rate limits, API timeouts,
  monitoring, backups, and access controls before exposing it to users.
- Chroma stores vectors locally. Protect the `chroma_db` directory and back it up.
- RRF uses ranks, not calibrated scores. Tune retrieval settings on a test set.
- The answer model and its availability can change; check the NVIDIA catalog if requests fail.
