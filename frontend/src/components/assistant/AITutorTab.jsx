import { useState, useEffect, useRef } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import { Send, Plus, X, Sparkles, Loader2, FileText } from 'lucide-react';

const SUGGESTIONS = [
  'Explain this topic simply',
  'Give me an example',
  'What are the key concepts?',
  'What should I remember for an exam?',
];

export default function AITutorTab({ selectedDocId, onDocChange }) {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);
  const bottomRef = useRef(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await documentApi.getDocuments();
        const ready = res.data.filter((d) => d.status === 'ready');
        setDocuments(ready);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);
    setError('');
    setSources([]);

    try {
      const res = await assistantApi.chat({
        message: trimmed,
        document_id: selectedDocId || null,
        history: messages,
      });
      setMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
      setSources(res.data.sources || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'KIKO could not respond. Try again.');
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSources([]);
    setError('');
  };

  const handleSelectDoc = (id) => {
    onDocChange?.(id);
    setSources([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedDoc ? (
            <div className="flex items-center gap-2 bg-[#EEF7F0] border border-[#1B4332]/20 rounded-full px-3 py-1.5">
              <FileText size={14} className="text-[#1B4332]" />
              <span className="text-[#1B4332] text-xs font-medium truncate max-w-[240px]">
                {selectedDoc.filename} · pp. 1–{selectedDoc.page_count}
              </span>
              <button
                onClick={() => onDocChange?.(null)}
                className="text-[#1B4332]/60 hover:text-[#1B4332]"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => e.target.value && handleSelectDoc(Number(e.target.value))}
              className="bg-white border border-[#E8ECE7] rounded-full px-3 py-1.5 text-xs text-[#4B5563] focus:outline-none focus:border-[#1B4332]"
            >
              <option value="">+ Attach material</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          )}
        </div>
        {!isEmpty && (
          <button
            onClick={clearChat}
            className="text-[#6B7280] hover:text-[#1B4332] text-xs font-medium px-3 py-1.5 rounded-full border border-[#E8ECE7] hover:border-[#1B4332]/40 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6 mb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 bg-[#FFF8E8] rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="text-[#D4A64A]" size={26} />
            </div>
            <h2 className="text-2xl font-bold text-[#1F2937] mb-2">
              Where should we start?
            </h2>
            <p className="text-[#6B7280] text-sm mb-8 max-w-md">
              {selectedDoc
                ? `Ask anything from ${selectedDoc.filename}.`
                : 'Ask KIKO anything — or attach study material for grounded answers.'}
            </p>

            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 rounded-full border border-[#E8ECE7] bg-white text-[#4B5563] text-sm hover:border-[#1B4332]/40 hover:bg-[#EEF7F0] hover:text-[#1B4332] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-[14px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-[#F8F7F2] text-[#1F2937] border border-[#E8ECE7]/60'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F8F7F2] border border-[#E8ECE7]/60 rounded-[14px] px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#1B4332]" />
                  <span className="text-[#6B7280] text-sm">KIKO is thinking…</span>
                </div>
              </div>
            )}

            {sources.length > 0 && !loading && (
              <div className="pt-2 border-t border-[#E8ECE7]/50">
                <p className="text-[#9CA3AF] text-xs mb-2">Sources from your material:</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (
                    <span
                      key={i}
                      className="text-[#1B4332] bg-[#EEF7F0] text-xs px-2.5 py-1 rounded-full border border-[#1B4332]/15"
                      title={s.preview}
                    >
                      Page {s.page}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-2.5 rounded-[14px] mb-3 text-xs flex-shrink-0">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="flex-shrink-0">
        <div className="bg-white rounded-[24px] shadow-[0px_4px_16px_rgba(16,24,40,0.08)] border border-[#E8ECE7]/50 flex items-end gap-2 p-2 pl-3">
          <button
            onClick={() => {
              const el = document.createElement('input');
              el.type = 'file';
              el.accept = 'application/pdf';
              el.click();
            }}
            className="p-2 rounded-full text-[#6B7280] hover:text-[#1B4332] hover:bg-[#EEF7F0] transition flex-shrink-0"
            title="Upload material"
          >
            <Plus size={18} />
          </button>

          {selectedDoc && (
            <span className="text-[#1B4332] bg-[#EEF7F0] text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0 mb-1">
              <FileText size={12} />
              <span className="max-w-[120px] truncate">{selectedDoc.filename}</span>
            </span>
          )}

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDoc ? 'Ask KIKO about your material…' : 'Ask KIKO anything…'}
            className="flex-1 bg-transparent text-[#1F2937] text-sm placeholder:text-[#9CA3AF] focus:outline-none resize-none py-3 px-1 max-h-[120px]"
            style={{ minHeight: '40px' }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#1B4332] hover:bg-[#24543F] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-center text-[#9CA3AF] text-[11px] mt-3">
          KIKO uses Groq RAG to answer strictly based on your uploaded document text.
        </p>
      </div>
    </div>
  );
}
