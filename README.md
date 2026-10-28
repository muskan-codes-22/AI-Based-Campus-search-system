# AI-Based Multimodal Campus Search & Exam Assistant (RAG)

An enterprise-inspired, lightweight Retrieval-Augmented Generation (RAG) system engineered for college campuses, university syllabus navigation, exam preparation, and campus document intelligence.

---

## Key Highlights

- **Multi-Format Ingestion**: Supports **PDFs**, **Microsoft Word (`.docx`)**, **PowerPoint (`.pptx`)**, **Excel (`.xlsx`, `.xls`)**, **CSV**, and **Markdown/Text (`.md`, `.txt`)**.
- **Table & Structure Preservation**: Converts complex tables from Word, Excel, and CSV directly into Markdown tables, enabling precise tabular retrieval and numerical reasoning.
- **Hybrid Retrieval**: Combines dense semantic vector search (via ChromaDB & `sentence-transformers/all-MiniLM-L6-v2`) with sparse keyword search (BM25) fused using **Reciprocal Rank Fusion (RRF)**.
- **Real-Time Token Streaming (SSE)**: Streams tokens via Server-Sent Events (`/api/chat/stream`), providing an instant typewriter effect with under 500ms first-token latency.
- **In-Memory TTL Cache**: Built-in caching for repeated campus questions (*"What are library hours?"*, *"Show the DBMS syllabus"*) delivering instantaneous responses.
- **Multi-User Sessions (SQLite)**: Built-in local session and thread management (`campus_rag.sqlite`) for isolated student chat histories without needing external database servers.
- **Exam-Oriented Modes**: Six student-tailored answering modes:
  - **Auto**: Automatically infers the question depth from phrasing.
  - **2 Marks**: Crisp definitions and concise answers without markdown tables.
  - **5 Marks**: Concept definitions, key bullet points, and practical examples.
  - **10 Marks**: Full exam-style layout with algorithms, pseudocode, and complexity tables.
  - **Revision**: 30-second bulleted summary highlighting exam pitfalls.
  - **Compare**: Side-by-side Markdown comparison tables with analytical takeaways.

---

## Architecture & Technology Stack

```text
AI-Based-Campus-search-system/
├── backend/
│   ├── chroma_db/            # Embedded Chroma vector database
│   ├── data/                 # Ingested multi-format documents (PDF, DOCX, PPTX, etc.)
│   ├── src/
│   │   ├── config.py         # App configuration & environment loader
│   │   ├── db.py             # SQLite session & chat history management
│   │   ├── embeddings.py     # SentenceTransformers embedding pipeline (CUDA/CPU)
│   │   ├── generation.py     # NVIDIA NIM LLM invocation & SSE streaming
│   │   ├── ingest.py         # Multi-format parser (Word, PPTX, Excel, PDF)
│   │   ├── retrieval.py      # Hybrid retriever (BM25 + Dense Chroma + RRF)
│   │   ├── server.py         # FastAPI application & REST/SSE endpoints
│   │   └── vector_store.py   # Persistent ChromaDB client & collection manager
│   ├── campus_rag.sqlite     # Local SQLite database (sessions & messages)
│   ├── requirements.txt      # Python dependencies
│   ├── run_server.py         # FastAPI startup script
│   └── .env.example          # Template for environment variables
├── frontend/
│   ├── src/
│   │   ├── components/       # ChatView, UploadView, Sidebar, SourceCitation, etc.
│   │   ├── api.js            # API client with real-time SSE stream reader
│   │   ├── App.jsx           # Main application state and view router
│   │   └── LandingPage.jsx   # Campus study portal landing page
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite + Tailwind CSS configuration
├── .gitignore
└── README.md
```

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons | Responsive UI with real-time token streaming and document upload dropzone |
| **Backend Framework** | FastAPI, Uvicorn | High-performance asynchronous API server |
| **Vector Database** | ChromaDB (Embedded SQLite) | Local, zero-setup dense vector storage |
| **Sparse Retrieval** | `rank-bm25` | Lexical keyword matching |
| **Fusion Algorithm** | Reciprocal Rank Fusion (RRF) | Merges and re-ranks dense and sparse candidate documents |
| **Embedding Model** | `all-MiniLM-L6-v2` | Computes 384-dimensional dense semantic vectors (runs on CPU or CUDA) |
| **LLM Inference** | NVIDIA NIM API (`nvidia/nemotron-3.5-bolt-e4b`) | Low-latency grounded reasoning and token generation |
| **Document Parsers** | `pypdf`, `python-docx`, `python-pptx`, `pandas`, `openpyxl` | Multi-format content and table extraction |
| **Database & Cache** | SQLite (`sqlite3`), `cachetools` | Session isolation, message persistence, and in-memory query caching |

---

## Supported File Formats

| Format | Extension | Extracted Data |
| :--- | :--- | :--- |
| **PDF** | `.pdf` | Multi-page text, headers, and exam notices |
| **Word** | `.docx`, `.doc` | Structured sections, bullet hierarchies, and tables formatted to Markdown |
| **PowerPoint** | `.pptx`, `.ppt` | Slide titles, bullet points, and presenter speaker notes |
| **Excel** | `.xlsx`, `.xls` | Worksheets converted into Markdown tabular datasets |
| **CSV** | `.csv` | Tabular campus schedules, course listings, and facilities data |
| **Text** | `.txt`, `.md` | Course notes, policies, and raw documentation |

---

## Getting Started

### 1. Prerequisites
- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: v18+ and `npm`
- **NVIDIA API Key**: Free API key from [build.nvidia.com](https://build.nvidia.com/)

---

### 2. Backend Setup

Open a terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install all dependencies
pip install -r requirements.txt

# Configure your environment variables
Copy-Item .env.example .env
```

Open `.env` and add your NVIDIA API key:
```env
NVIDIA_API_KEY=nvapi-your-key-here
NVIDIA_MODEL=nvidia/nemotron-3.5-bolt-e4b
```

Run the backend server:
```powershell
python run_server.py
```
Backend will start at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

In a new terminal window:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## CLI Document Ingestion

You can upload documents directly from the web interface, or ingest them via the command line:

1. Drop your files (`.pdf`, `.docx`, `.pptx`, `.xlsx`, `.csv`) into `backend/data/`.
2. Run the ingestion script:
   ```powershell
   backend\.venv\Scripts\python backend\ingest.py
   ```
The script detects new or modified files using SHA-256 hashes and incrementally updates ChromaDB.

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat/stream` | Server-Sent Events (SSE) streaming chat endpoint (yields sources, then tokens) |
| `POST` | `/api/chat` | Synchronous chat endpoint (returns full JSON response) |
| `POST` | `/api/upload` | Uploads and indexes multiple files (`.pdf`, `.docx`, `.pptx`, `.xlsx`, `.csv`, `.txt`) |
| `GET` | `/api/documents` | Lists all indexed documents, chunk counts, and upload timestamps |
| `DELETE` | `/api/documents/{name}` | Deletes a document from disk and purges its chunks from Chroma |
| `GET` | `/api/sessions` | Lists user study sessions from SQLite |
| `POST` | `/api/sessions` | Creates a new isolated study session |
| `GET` | `/api/sessions/{id}/messages` | Fetches historical Q&A messages for a session |
| `GET` | `/api/stats` | Returns total indexed document and chunk counts |
| `GET` | `/api/health` | Health-check endpoint verifying LLM readiness and supported extensions |
