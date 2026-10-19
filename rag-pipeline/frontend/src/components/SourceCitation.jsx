import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources">
      <div className="sources-header">
        <div className="sources-title">
          <BookOpen size={13} />
          <span>Sources ({sources.length})</span>
        </div>
        {sources.some((s) => s.excerpt) && (
          <button
            type="button"
            className="btn ghost sm"
            style={{ padding: '2px 6px', height: 'auto', minHeight: 'unset' }}
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

      <ul>
        {sources.map((source, idx) => {
          const fileName = typeof source === 'string' ? source : source.file || source.filename;
          const page = typeof source === 'object' ? source.page : null;
          const excerpt = typeof source === 'object' ? source.excerpt : null;

          return (
            <li key={idx} className="source-item">
              <code>{fileName}</code>
              {page && <span>{typeof page === 'number' ? `p. ${page}` : page}</span>}
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
