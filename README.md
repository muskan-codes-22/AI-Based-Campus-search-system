# AI-Based Campus Search System

An AI-powered campus search and retrieval-augmented generation (RAG) platform for university documents, campus guides, schedules, and policies.

---

## Project Structure

```text
AI-Based-Campus-search-system/
├── backend/          # FastAPI server, Chroma vector store, embeddings & RAG pipeline
├── frontend/         # React + Vite + Tailwind CSS web interface
├── .gitignore        # Global gitignore configuration
└── README.md         # Project documentation
```

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Fill in NVIDIA_API_KEY in .env

# Run FastAPI backend server
python run_server.py
```
Backend runs at `http://localhost:8000` (API docs at `http://localhost:8000/docs`).

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.
