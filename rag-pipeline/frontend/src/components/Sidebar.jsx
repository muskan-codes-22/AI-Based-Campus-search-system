import React from 'react';
import { GraduationCap, MessageSquare, FileText, History, UploadCloud } from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, docCount = 0, chunkCount = 0 }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">
          <div className="brand-logo-wrap">
            <GraduationCap size={22} color="#ffffff" />
          </div>
          <span className="brand-text">Campus AI</span>
        </div>
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
          className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => onSelectTab('documents')}
        >
          <div className="nav-item-content">
            <FileText size={18} />
            <span>Documents</span>
          </div>
          <span className="nav-badge">{docCount}</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
        >
          <div className="nav-item-content">
            <History size={18} />
            <span>History</span>
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
        </button>
      </nav>

      <div className="sidebar-foot">
        <div className="status-pill-card">
          <span className="status-dot-pulse" />
          <span className="status-pill-text">
            Index ready, {docCount} documents, {chunkCount} chunks
          </span>
        </div>
      </div>
    </aside>
  );
}
