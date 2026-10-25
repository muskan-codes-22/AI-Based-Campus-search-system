import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Trash2,
  Bot,
  Table2,
  ClipboardList,
  Code2,
  Languages,
  Mic,
  Paperclip,
  ArrowRight,
} from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';
import SourceCitation from './SourceCitation';


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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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

  const handleQuickPrompt = (promptText) => {
    onSendMessage(promptText);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning, what are you studying today?';
    if (hour < 17) return 'Good afternoon, what are you studying today?';
    return 'Good evening, what are you studying today?';
  };

  return (
    <section className="view view-chat">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Chat</h1>
          <span className="meta">Collection: {collectionName}</span>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="assistant-mode-badge" title="Structured professional answers with Markdown, tables, code, and source citations">
            <Sparkles size={13} />
            <span>Academic & Professional Mode</span>
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
          <div className="chat-hero-container">
            <div className="chat-hero-header">
              <h2 className="chat-hero-greeting">{getGreeting()}</h2>
              <p className="chat-hero-subtitle">
                Search, summarize, and understand your indexed campus documents with AI.
              </p>
            </div>

            {/* 2x2 Grid of rounded suggestion cards */}
            <div className="suggestion-cards-grid">
              <button
                type="button"
                className="suggestion-action-card"
                onClick={() => handleQuickPrompt('Compare Big-O, Big-Omega, and Big-Theta notations in a comparison table')}
              >
                <div className="card-icon-wrap teal">
                  <Table2 size={24} color="#14B8A6" />
                </div>
                <div className="card-title">Compare in a table</div>
              </button>

              <button
                type="button"
                className="suggestion-action-card"
                onClick={() => handleQuickPrompt('Give me a high-yield exam preparation summary of the key concepts')}
              >
                <div className="card-icon-wrap indigo">
                  <ClipboardList size={24} color="#4F46E5" />
                </div>
                <div className="card-title">Exam preparation</div>
              </button>

              <button
                type="button"
                className="suggestion-action-card"
                onClick={() => handleQuickPrompt('Show a code example with runtime complexity and comments')}
              >
                <div className="card-icon-wrap teal">
                  <Code2 size={24} color="#14B8A6" />
                </div>
                <div className="card-title">Code example</div>
              </button>

              <button
                type="button"
                className="suggestion-action-card"
                onClick={() => handleQuickPrompt('Explain the core concepts in simple Hinglish with examples')}
              >
                <div className="card-icon-wrap indigo">
                  <Languages size={24} color="#4F46E5" />
                </div>
                <div className="card-title">Ask in Hinglish</div>
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
                <Bot size={15} color="#4F46E5" />
                <span>Campus AI</span>
              </div>
              <MarkdownMessage content={msg.content} />
              {msg.sources && msg.sources.length > 0 && (
                <SourceCitation sources={msg.sources} />
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="msg assistant">
            <div className="role">
              <Sparkles size={15} color="#4F46E5" />
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

      <div className="composer-wrapper">
        <form onSubmit={handleSubmit} className="floating-composer-bar">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your campus documents..."
            disabled={isLoading}
            className="floating-composer-input"
          />

          <div className="floating-composer-actions">
            <button
              type="button"
              className="action-icon-btn"
              title="Voice input"
              onClick={() => {}}
            >
              <Mic size={18} />
            </button>
            <button
              type="button"
              className="action-icon-btn"
              title="Attach document"
              onClick={() => {}}
            >
              <Paperclip size={18} />
            </button>
            <button
              className="send-btn-indigo"
              type="submit"
              disabled={isLoading || !input.trim()}
              title="Send message"
            >
              <span>Send</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
