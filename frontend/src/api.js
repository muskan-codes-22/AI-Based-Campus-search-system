// API client for interacting with the backend FastAPI RAG pipeline.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function askQuestion(question, history = [], answerMode = 'auto') {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history, answer_mode: answerMode }),
  });

  if (!res.ok) {
    let errorDetail = 'Failed to get answer from backend';
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch (_) {
      errorDetail = `Server returned status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = 'Upload failed';
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch (_) {
      errorDetail = `Server returned status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/api/documents`);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  return await res.json();
}

export async function deleteDocument(filename) {
  const res = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.statusText}`);
  }
  return await res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health check: ${res.statusText}`);
  }
  return await res.json();
}
