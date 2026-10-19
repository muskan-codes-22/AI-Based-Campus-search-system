import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot, CornerDownLeft, Code2, Check, Copy } from 'lucide-react';
import SourceCitation from './SourceCitation';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="code-block-copy-btn"
          title="Copy code snippet"
        >
          {copied ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Copied
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Copy size={12} /> Copy
            </span>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormattedMessage({ content }) {
  if (!content) return null;

  // Extract code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  const renderInline = (str) => {
    // Strip leading Markdown headers like ### if any
    const clean = str.replace(/^###+\s*/gm, '');
    const tokens = clean.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

    return tokens.map((token, i) => {
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code key={i} className="inline-code">
            {token.slice(1, -1)}
          </code>
        );
      }
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return <strong key={i}>{token.slice(2, -2)}</strong>;
      }
      return token;
    });
  };

  return (
    <div className="bubble-body">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={pIdx}
              language={part.language}
              code={part.content}
            />
          );
        }

        const paragraphs = part.content.split('\n\n').filter(Boolean);
        return paragraphs.map((para, idx) => {
          const lines = para.split('\n').filter(Boolean);
          const isList = lines.length > 1 && lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

          if (isList) {
            return (
              <ul key={`${pIdx}-${idx}`}>
                {lines.map((line, lIdx) => (
                  <li key={lIdx}>
                    {renderInline(line.trim().replace(/^[-*]\s+/, ''))}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`${pIdx}-${idx}`}>
              {renderInline(para)}
            </p>
          );
        });
      })}
    </div>
  );
}

export default function ChatView({
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  collectionName = 'PDF Knowledge Base',
}) {
  const [input, setInput] = useState('');
  const threadEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    threadEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handlePromptChip = (chipText) => {
    if (!input.trim()) {
      setInput(chipText);
    } else {
      setInput((prev) => `${prev.trim()} (${chipText})`);
    }
    textareaRef.current?.focus();
  };

  return (
    <section className="view view-chat">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Chat</h1>
          <span className="meta">Collection: {collectionName}</span>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="assistant-mode-badge" title="Answers are direct, natural, beginner-friendly, and cite indexed documents">
            <Sparkles size={12} />
            <span>Simple & Natural Mode</span>
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              className="btn secondary sm"
              onClick={onClearChat}
              title="Clear conversation"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </header>

      <div className="thread">
        {messages.length === 0 && !isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--faint)',
            textAlign: 'center',
            padding: '40px 20px',
            gap: '14px'
          }}>
            <Bot size={40} style={{ color: 'var(--navy)', opacity: 0.8 }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--navy)' }}>
              Campus AI Search & Assistant
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '420px', lineHeight: 1.5, color: 'var(--muted)' }}>
              Ask questions naturally in <strong>simple English</strong> or <strong>Hinglish</strong>. Answers are straightforward, beginner-friendly, and cited directly from your campus documents.
            </p>
            <div className="suggestion-chips-bar" style={{ justifyContent: 'center', marginTop: '6px' }}>
              <button
                type="button"
                className="suggestion-chip"
                onClick={() => handlePromptChip('Explain simply')}
              >
                💡 Explain simply
              </button>
              <button
                type="button"
                className="suggestion-chip"
                onClick={() => handlePromptChip('Show a small code example')}
              >
                💻 Give a code example
              </button>
              <button
                type="button"
                className="suggestion-chip"
                onClick={() => handlePromptChip('Explain in Hinglish')}
              >
                🇮🇳 In Hinglish
              </button>
              <button
                type="button"
                className="suggestion-chip"
                onClick={() => handlePromptChip('What are the key points?')}
              >
                ⚡ Key takeaways
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.role === 'user') {
            return (
              <div key={index} className="msg user">
                <div className="bubble">{msg.content}</div>
              </div>
            );
          }

          return (
            <div key={index} className="msg assistant">
              <div className="role">
                <Bot size={14} />
                <span>Assistant</span>
              </div>
              <FormattedMessage content={msg.content} />
              {msg.sources && msg.sources.length > 0 && (
                <SourceCitation sources={msg.sources} />
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="msg assistant">
            <div className="role">
              <Sparkles size={14} />
              <span>Analyzing documents...</span>
            </div>
            <div className="typing-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      <div className="composer">
        {messages.length > 0 && (
          <div className="suggestion-chips-bar">
            <button
              type="button"
              className="suggestion-chip"
              disabled={isLoading}
              onClick={() => handlePromptChip('Explain this simply')}
            >
              💡 Explain simply
            </button>
            <button
              type="button"
              className="suggestion-chip"
              disabled={isLoading}
              onClick={() => handlePromptChip('Show a small code example')}
            >
              💻 Code example
            </button>
            <button
              type="button"
              className="suggestion-chip"
              disabled={isLoading}
              onClick={() => handlePromptChip('Explain in Hinglish')}
            >
              🇮🇳 In Hinglish
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="composer-box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your campus documents (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
          />
          <div className="composer-actions">
            <button
              className="btn"
              type="submit"
              disabled={isLoading || !input.trim()}
              title="Send message"
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </div>
        </form>
        <div className="composer-note">
          <span>Answers are direct & easy to understand, grounded in your indexed campus documents.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <CornerDownLeft size={11} /> Enter to send
          </span>
        </div>
      </div>
    </section>
  );
}

