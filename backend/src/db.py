import sqlite3
import json
import datetime
from pathlib import Path
from typing import List, Optional

try:
    from .config import BASE_DIR
except ImportError:
    from config import BASE_DIR

DB_PATH = BASE_DIR / "campus_rag.sqlite"


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create local SQLite tables for multi-user chat sessions and message history."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                user_name TEXT DEFAULT 'Student',
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
            )
        """)
        # Ensure default session exists
        cur = conn.execute("SELECT id FROM sessions WHERE id = 'default'")
        if not cur.fetchone():
            now = datetime.datetime.now().isoformat()
            conn.execute(
                "INSERT INTO sessions (id, title, user_name, created_at) VALUES (?, ?, ?, ?)",
                ("default", "General Study Session", "Student", now)
            )


def list_sessions() -> List[dict]:
    with get_db() as conn:
        rows = conn.execute("SELECT id, title, user_name, created_at FROM sessions ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]


def create_session(session_id: str, title: str = "New Study Session", user_name: str = "Student") -> dict:
    now = datetime.datetime.now().isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO sessions (id, title, user_name, created_at) VALUES (?, ?, ?, ?)",
            (session_id, title, user_name, now)
        )
    return {"id": session_id, "title": title, "user_name": user_name, "created_at": now}


def delete_session(session_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))


def get_session_messages(session_id: str) -> List[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT role, content, sources, created_at FROM messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        ).fetchall()
        messages = []
        for r in rows:
            sources = []
            if r["sources"]:
                try:
                    sources = json.loads(r["sources"])
                except Exception:
                    pass
            messages.append({
                "role": r["role"],
                "content": r["content"],
                "sources": sources,
                "created_at": r["created_at"],
            })
        return messages


def add_message(session_id: str, role: str, content: str, sources: Optional[List[dict]] = None):
    now = datetime.datetime.now().isoformat()
    sources_json = json.dumps(sources or [])
    with get_db() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, role, content, sources_json, now)
        )


# Initialize schema on load
init_db()
