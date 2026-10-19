import React from 'react';
import { MessageSquare, UploadCloud, Database } from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, docCount = 0, chunkCount = 0 }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">
          <Database size={22} color="var(--navy)" />
          <span>RAG Console</span>
        </div>
        <span>Document question answering</span>
      </div>

      <nav className="nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <div className="nav-item-content">
            <MessageSquare size={18} />
            <span>Chat</span>
          </div>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => onSelectTab('upload')}
        >
          <div className="nav-item-content">
            <UploadCloud size={18} />
            <span>Upload</span>
          </div>
          <span className="nav-badge">{docCount}</span>
        </button>
      </nav>

      <div className="sidebar-foot">
        <div className="status-indicator">
          <span className="status-dot-pulse" />
          <span>Index live & ready</span>
        </div>
        <div>
          {docCount} documents &middot; {chunkCount.toLocaleString()} chunks
        </div>
      </div>
    </aside>
  );
}
