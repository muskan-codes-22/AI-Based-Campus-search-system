import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Copy, Check } from 'lucide-react';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="md-code-copy-btn"
          title="Copy code snippet"
        >
          {copied ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Check size={13} />
              <span>Copied</span>
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Copy size={13} />
              <span>Copy</span>
            </span>
          )}
        </button>
      </div>
      <pre className="md-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownMessage({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-message-root">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Code overrides: inline vs block
          pre({ children }) {
            return <>{children}</>;
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = Boolean(match) || String(children).includes('\n');
            if (isCodeBlock) {
              return (
                <CodeBlock
                  language={match ? match[1] : ''}
                  code={String(children).replace(/\n$/, '')}
                />
              );
            }
            return (
              <code className="md-inline-code" {...props}>
                {children}
              </code>
            );
          },

          // Table wrapped in horizontally scrollable container
          table({ node, ...props }) {
            return (
              <div className="md-table-wrap">
                <table className="md-table" {...props} />
              </div>
            );
          },

          // Headings
          h2({ node, ...props }) {
            return <h2 className="md-h2" {...props} />;
          },
          h3({ node, ...props }) {
            return <h3 className="md-h3" {...props} />;
          },

          // Lists ul & ol
          ul({ node, ...props }) {
            return <ul className="md-ul" {...props} />;
          },
          ol({ node, ...props }) {
            return <ol className="md-ol" {...props} />;
          },

          // Paragraph
          p({ node, ...props }) {
            return <p className="md-p" {...props} />;
          },

          // Horizontal rule / dividers
          hr({ node, ...props }) {
            return <hr className="md-hr" {...props} />;
          },

          // Links (open in new tab)
          a({ node, href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="md-link"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Blockquote
          blockquote({ node, ...props }) {
            return <blockquote className="md-blockquote" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
