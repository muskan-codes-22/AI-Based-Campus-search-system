import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import UploadView from './components/UploadView';
import { askQuestion, uploadFiles, fetchDocuments, deleteDocument } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Load real documents from backend
  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.warn('Could not load documents from backend:', err.message);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Calculate live statistics from actual indexed documents
  const totalChunks = documents.reduce((sum, doc) => sum + (Number(doc.chunks) || 0), 0);
  const totalDocs = documents.length;

  const handleSendMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askQuestion(text, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error communicating with backend: ${err.message}`,
          sources: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleIndexFiles = async (files) => {
    setIsIndexing(true);
    try {
      await uploadFiles(files);
      await loadDocuments();
    } catch (err) {
      console.error('Indexing failed:', err);
      alert(`Indexing failed: ${err.message}`);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleRemoveDocument = async (fileName) => {
    try {
      await deleteDocument(fileName);
      setDocuments((prev) => prev.filter((d) => d.name !== fileName));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert(`Could not delete document: ${err.message}`);
    }
  };

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        docCount={totalDocs}
        chunkCount={totalChunks}
      />

      <main>
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isLoading}
            collectionName="PDF Knowledge Base"
          />
        )}

        {(activeTab === 'upload' || activeTab === 'documents') && (
          <UploadView
            documents={documents}
            onIndexFiles={handleIndexFiles}
            onRemoveDocument={handleRemoveDocument}
            isIndexing={isIndexing}
          />
        )}

        {activeTab === 'history' && (
          <section className="view view-history">
            <header className="topbar">
              <div className="topbar-left">
                <h1>Chat History</h1>
                <span className="meta">Saved queries and past academic sessions</span>
              </div>
            </header>
            <div className="history-content">
              {messages.length === 0 ? (
                <div className="empty-history-placeholder">
                  <p>No chat history in this session yet. Start chatting from the Chat tab!</p>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => setActiveTab('chat')}
                  >
                    Go to Chat
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`history-card ${m.role}`}>
                      <strong>{m.role === 'user' ? 'You' : 'Campus AI'}:</strong>
                      <p>{m.content.slice(0, 180)}{m.content.length > 180 ? '...' : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
