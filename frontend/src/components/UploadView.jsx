import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function getFileBadge(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'pdf':
      return { label: 'PDF', bg: '#FEE2E2', color: '#DC2626' };
    case 'docx':
    case 'doc':
      return { label: 'DOCX', bg: '#DBEAFE', color: '#2563EB' };
    case 'pptx':
    case 'ppt':
      return { label: 'PPTX', bg: '#FFEDD5', color: '#EA580C' };
    case 'xlsx':
    case 'xls':
      return { label: 'XLSX', bg: '#DCFCE7', color: '#16A34A' };
    case 'csv':
      return { label: 'CSV', bg: '#D1FAE5', color: '#059669' };
    default:
      return { label: ext.toUpperCase() || 'TXT', bg: '#F1F5F9', color: '#475569' };
  }
}

export default function UploadView({
  activeTab = 'documents',
  documents = [],
  onIndexFiles,
  onRemoveDocument,
  isIndexing = false,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropzone, setShowDropzone] = useState(activeTab === 'upload');
  const [indexingElapsed, setIndexingElapsed] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isIndexing) {
      setIndexingElapsed(0);
      interval = setInterval(() => {
        setIndexingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setIndexingElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIndexing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
      setShowDropzone(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
    setShowDropzone(true);
  };

  const removeSelectedFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleStartIndexing = async () => {
    if (selectedFiles.length === 0 || isIndexing) return;
    await onIndexFiles(selectedFiles);
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (activeTab === 'documents') {
      setShowDropzone(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredDocs = documents.filter((doc) =>
    (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalChunks = documents.reduce((sum, d) => sum + (Number(d.chunks) || 0), 0);

  const isUploadMode = activeTab === 'upload';

  return (
    <section className="view view-upload" onDragEnter={handleDrag}>
      <header className="topbar">
        <div className="topbar-left">
          <h1>{isUploadMode ? 'Upload Documents' : 'Indexed Documents'}</h1>
          <span className="meta">
            {isUploadMode
              ? 'Add new PDF, Word, PowerPoint, or Excel files to the campus knowledge base'
              : `${documents.length} document${documents.length === 1 ? '' : 's'} (${totalChunks} chunks) indexed in persistent vector storage`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isUploadMode && (
            <button
              type="button"
              className={`btn ${showDropzone ? 'secondary' : 'primary'} sm`}
              onClick={() => setShowDropzone(!showDropzone)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showDropzone ? (
                <>
                  <ChevronUp size={15} />
                  <span>Hide Uploader</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Add Documents</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="upload-body">
        {/* Dropzone section: shown either in upload tab or when toggled in documents tab */}
        {(showDropzone || isUploadMode || selectedFiles.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '8px' }}>
            <div className="section-head">
              <h2>Add documents</h2>
              <p>Files are parsed, split into chunks, embedded, and added to the collection.</p>
            </div>

            <label
              className={`dropzone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon">
                <UploadCloud size={24} />
              </div>
              <strong>Drop files here or choose files</strong>
              <span>Select PDF, DOCX, PPTX, XLSX, CSV, or Text files from your computer</span>
              <span className="formats">PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), CSV &middot; up to 50 MB each</span>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md"
                onChange={handleFileInputChange}
              />
              <span className="btn secondary" style={{ marginTop: '8px', padding: '6px 14px', minHeight: 'unset', fontSize: '13px' }}>
                Browse files
              </span>
            </label>

            {/* Active Indexing Progress Banner */}
            {isIndexing && (
              <div className="indexing-banner">
                <div className="indexing-banner-header">
                  <Loader2 size={16} className="spin-icon" />
                  <span>Parsing, splitting into chunks & generating neural embeddings...</span>
                  <span className="indexing-banner-timer">{indexingElapsed}s</span>
                </div>
                <div className="indexing-progress-bar">
                  <div className="indexing-progress-fill" />
                </div>
                <p className="indexing-banner-note">
                  Large files (5–10+ MB) produce hundreds of chunks embedded via sentence-transformers on CPU. This typically takes 30–60 seconds—please keep this page open!
                </p>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="staged-files">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {isIndexing ? 'Indexing Files in Progress...' : `Pending Upload (${selectedFiles.length})`}
                </div>
                {selectedFiles.map((f) => (
                  <div key={f.name} className="staged-file-item">
                    <div className="staged-file-info">
                      <FileText size={16} />
                      <span>{f.name}</span>
                      <span className="staged-file-size">({formatFileSize(f.size)})</span>
                    </div>
                    {isIndexing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4F46E5', fontWeight: 500 }}>
                        <Loader2 size={13} className="spin-icon" />
                        <span>Embedding...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={(e) => {
                          e.preventDefault();
                          removeSelectedFile(f.name);
                        }}
                        title="Remove from list"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <span className="meta">
                {isIndexing
                  ? `Processing ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}...`
                  : selectedFiles.length === 0
                  ? 'No files selected'
                  : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready to index`}
              </span>
              <button
                className="btn primary"
                type="button"
                disabled={selectedFiles.length === 0 || isIndexing}
                onClick={handleStartIndexing}
              >
                {isIndexing ? (
                  <>
                    <Loader2 size={16} className="spin-icon" />
                    <span>Indexing documents ({indexingElapsed}s)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Index documents</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Indexed documents section */}
        <div className="section-head" style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2>
              Indexed documents{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>
                ({documents.length})
              </span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--faint)' }} />
              <input
                type="text"
                placeholder="Filter indexed files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: '1px solid var(--line-strong)',
                  borderRadius: '6px',
                  padding: '6px 10px 6px 30px',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'var(--text)',
                  width: '220px',
                }}
              />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '45%' }}>File</th>
                <th style={{ width: '20%' }}>Uploaded</th>
                <th className="num" style={{ width: '15%' }}>Chunks</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '5%', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--faint)' }}>
                    {searchQuery ? 'No indexed documents match your search.' : 'No documents indexed yet. Upload files to get started!'}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  let statusClass = 'ok';
                  let statusText = doc.status || 'Indexed';

                  if (doc.status === 'Processing' || doc.status === 'Pending') {
                    statusClass = 'processing';
                  } else if (doc.status === 'Failed' || doc.status === 'Unsupported') {
                    statusClass = 'failed';
                  }

                  const badge = getFileBadge(doc.name);

                  return (
                    <tr key={doc.name}>
                      <td className="file">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              letterSpacing: '0.04em',
                              flexShrink: 0,
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontWeight: 500, color: 'var(--navy)', wordBreak: 'break-all' }}>
                            {doc.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '13.5px' }}>{doc.uploaded}</td>
                      <td className="num">{doc.chunks !== null && doc.chunks !== undefined ? doc.chunks : '—'}</td>
                      <td>
                        <span className={`status ${statusClass}`}>{statusText}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => onRemoveDocument && onRemoveDocument(doc.name)}
                          title="Delete from index"
                          style={{ padding: '6px', minHeight: 'unset', color: '#94A3B8' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
