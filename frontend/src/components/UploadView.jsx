import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
} from 'lucide-react';

export default function UploadView({
  documents,
  onIndexFiles,
  onRemoveDocument,
  isIndexing,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
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
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const filteredDocs = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="view view-upload">
      <header className="topbar">
        <div className="topbar-left">
          <h1>Upload</h1>
          <span className="meta">Add documents to the index</span>
        </div>
      </header>

      <div className="upload-body">
        <div className="section-head">
          <h2>Add documents</h2>
          <p>Files are split into chunks, embedded, and added to the collection.</p>
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
          <span>Select one or more files from your computer</span>
          <span className="formats">PDF, DOCX, PPTX, XLSX, CSV, TXT, MD &middot; up to 50 MB each</span>

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

        {selectedFiles.length > 0 && (
          <div className="staged-files">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pending Upload ({selectedFiles.length})
            </div>
            {selectedFiles.map((f) => (
              <div key={f.name} className="staged-file-item">
                <div className="staged-file-info">
                  <FileText size={16} />
                  <span>{f.name}</span>
                  <span className="staged-file-size">({formatFileSize(f.size)})</span>
                </div>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={(e) => {
                    e.preventDefault();
                    removeSelectedFile(f.name);
                  }}
                  title="Remove from queue"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="actions">
          <span className="meta">
            {selectedFiles.length === 0
              ? 'No files selected'
              : `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} ready to index`}
          </span>
          <button
            className="btn"
            type="button"
            disabled={selectedFiles.length === 0 || isIndexing}
            onClick={handleStartIndexing}
          >
            {isIndexing ? (
              <>
                <Loader2 size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Indexing documents...</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>Index documents</span>
              </>
            )}
          </button>
        </div>

        <div className="section-head" style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                }}
              />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Uploaded</th>
                <th className="num">Chunks</th>
                <th>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--faint)' }}>
                    No indexed documents match your query.
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

                  return (
                    <tr key={doc.name}>
                      <td className="file">{doc.name}</td>
                      <td>{doc.uploaded}</td>
                      <td className="num">{doc.chunks !== null && doc.chunks !== undefined ? doc.chunks : '—'}</td>
                      <td>
                        <span className={`status ${statusClass}`}>{statusText}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => onRemoveDocument && onRemoveDocument(doc.name)}
                          title="Delete from index"
                          style={{ padding: '4px', minHeight: 'unset' }}
                        >
                          <Trash2 size={14} />
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
