import { useState, useEffect, useRef } from 'react';
import { documentApi } from '../../services/api';
import {
  Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, X,
} from 'lucide-react';

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

  useEffect(() => {
    loadDocuments();
  }, []);

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
      {/* Upload zone */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1F2937]">My Study Materials</h2>
          <span className="text-[#6B7280] text-xs">
            {documents.length} {documents.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {error && (
          <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-4 text-sm flex items-start justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-[#D14343]/70 hover:text-[#D14343]">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[18px] p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-[#1B4332] bg-[#EEF7F0]'
              : 'border-[#E8ECE7] hover:border-[#1B4332]/40 hover:bg-[#F8F7F2]'
          } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 size={32} className="text-[#1B4332] mx-auto mb-3 animate-spin" />
              <p className="text-[#1F2937] font-medium">Processing your file...</p>
              <p className="text-[#6B7280] text-xs mt-1">Extracting text and indexing</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-[#EEF7F0] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload className="text-[#1B4332]" size={22} />
              </div>
              <p className="text-[#1F2937] font-medium">
                Drop your PDF here or click to browse
              </p>
              <p className="text-[#6B7280] text-xs mt-1">PDF only · Max 10 MB</p>
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

      {/* Document list */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Library</h2>

        {loading ? (
          <div className="text-center py-8 text-[#6B7280] text-sm">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-[#1F2937] font-medium">Your study library is empty</p>
            <p className="text-[#6B7280] text-sm mt-1">
              Upload your first PDF to get summaries, flashcards, quizzes and more.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-4 p-4 bg-[#F8F7F2] rounded-[14px] hover:bg-[#EEF7F0] transition group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-[#EEF7F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="text-[#1B4332]" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[#1F2937] font-medium text-sm truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-0.5">
                      <span>{doc.page_count} pages</span>
                      <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                      <span>{formatSize(doc.file_size)}</span>
                      <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                      {doc.status === 'ready' ? (
                        <span className="flex items-center gap-1 text-[#2E7D32]">
                          <CheckCircle size={12} /> Ready
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-[#D14343]">
                          <AlertCircle size={12} /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#D4A64A]">
                          <Loader2 size={12} className="animate-spin" /> Processing
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onDocumentReady && doc.status === 'ready' && (
                    <button
                      onClick={() => onDocumentReady(doc.id)}
                      className="text-[#1B4332] text-xs font-medium hover:underline"
                    >
                      Select
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-[#9CA3AF] hover:text-[#D14343] p-2 rounded-lg transition"
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
