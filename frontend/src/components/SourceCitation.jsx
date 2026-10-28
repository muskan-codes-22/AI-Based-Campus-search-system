import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-container">
      <div className="sources-header">
        <div className="sources-title">
          <BookOpen size={14} />
          <span>Sources ({sources.length})</span>
        </div>
        {sources.some((s) => s.excerpt) && (
          <button
            type="button"
            className="btn ghost sm excerpt-toggle-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                Hide excerpts <ChevronUp size={12} />
              </>
            ) : (
              <>
                Show excerpts <ChevronDown size={12} />
              </>
            )}
          </button>
        )}
      </div>

      <ul className="sources-list">
        {sources.map((source, idx) => {
          const fileName = typeof source === 'string' ? source : source.file || source.filename;
          const page = typeof source === 'object' ? source.page : null;
          const excerpt = typeof source === 'object' ? source.excerpt : null;

          return (
            <li key={idx} className="source-item">
              <div className="source-badge">
                <FileText size={12} className="source-icon" />
                <span className="source-filename">{fileName}</span>
                {page && (
                  <span className="source-page-tag">
                    {typeof page === 'number' ? `p. ${page}` : page}
                  </span>
                )}
              </div>
              {expanded && excerpt && (
                <div className="source-snippet">
                  &ldquo;{excerpt}&rdquo;
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
