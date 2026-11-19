import { useState, useEffect, useRef } from 'react';
import { documentApi } from '../../services/api';
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, X, BookOpen } from 'lucide-react';

export default function DocumentsTab({ onDocumentReady }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentApi.getDocuments();
      setDocuments(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await documentApi.upload(formData);
      setDocuments((prev) => [res.data, ...prev]);
      if (onDocumentReady) onDocumentReady(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await documentApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">My Study Materials</h2>
          <span className="text-[#8E8E93] text-xs font-medium">
            {documents.length} {documents.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {error && (
          <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-4 text-sm flex items-start justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-[#EF4444]/70 hover:text-[#EF4444]">
              <X size={16} />
            </button>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[18px] p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-[#FF841C] bg-[#261A10]'
              : 'border-[#2E2E32] hover:border-[#FF841C]/50 hover:bg-[#232325]'
          } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 size={32} className="text-[#FF841C] mx-auto mb-3 animate-spin" />
              <p className="text-white font-semibold">Processing your file...</p>
              <p className="text-[#8E8E93] text-xs mt-1">Extracting text and indexing</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="text-[#FF841C]" size={22} />
              </div>
              <p className="text-white font-semibold">Drop your PDF here or click to browse</p>
              <p className="text-[#8E8E93] text-xs mt-1">PDF only · Max 10 MB</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-white mb-4">Library</h2>

        {loading ? (
          <div className="text-center py-8 text-[#8E8E93] text-sm">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BookOpen className="text-[#8E8E93]" size={22} />
            </div>
            <p className="text-white font-semibold">Your study library is empty</p>
            <p className="text-[#8E8E93] text-sm mt-1">
              Upload your first PDF to get summaries, flashcards, quizzes and more.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-4 p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px] hover:border-[#FF841C]/40 transition group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-[#1A1A1A] border border-[#2E2E32] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-[#FF841C]" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{doc.filename}</p>
                    <div className="flex items-center gap-3 text-[#8E8E93] text-xs mt-0.5">
                      <span>{doc.page_count} pages</span>
                      <span className="w-1 h-1 bg-[#2E2E32] rounded-full"></span>
                      <span>{formatSize(doc.file_size)}</span>
                      <span className="w-1 h-1 bg-[#2E2E32] rounded-full"></span>
                      {doc.status === 'ready' ? (
                        <span className="flex items-center gap-1 text-[#10B981] font-medium">
                          <CheckCircle size={12} /> Ready
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-[#EF4444]">
                          <AlertCircle size={12} /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#FF841C]">
                          <Loader2 size={12} className="animate-spin" /> Processing
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onDocumentReady && doc.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => onDocumentReady(doc.id)}
                      className="text-[#FF841C] text-xs font-semibold hover:underline px-2 py-1"
                    >
                      Select
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="text-[#8E8E93] hover:text-[#EF4444] p-2 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}