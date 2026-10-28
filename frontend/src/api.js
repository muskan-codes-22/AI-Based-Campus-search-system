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

/**
 * Real-time SSE streaming client.
 * Calls onSources(sourcesList) as soon as retrieval finishes.
 * Calls onToken(tokenString) as each token arrives from the LLM.
 */
export async function askQuestionStream(question, history = [], answerMode = 'auto', onSources, onToken) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history, answer_mode: answerMode }),
  });

  if (!res.ok) {
    let errorDetail = 'Failed to stream answer from backend';
    try {
      const errorJson = await res.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch (_) {
      errorDetail = `Server returned status ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const block of lines) {
      if (!block.trim()) continue;
      const eventMatch = block.match(/^event:\s*(\w+)/m);
      const dataMatch = block.match(/^data:\s*(.*)/m);

      const event = eventMatch ? eventMatch[1] : 'message';
      const rawData = dataMatch ? dataMatch[1] : '';

      try {
        const parsed = JSON.parse(rawData);
        if (event === 'sources' && onSources) {
          onSources(parsed);
        } else if (event === 'token' && onToken) {
          onToken(parsed.delta || '');
        }
      } catch (_) {
        if (event === 'token' && onToken) {
          onToken(rawData);
        }
      }
    }
  }
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

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.statusText}`);
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
