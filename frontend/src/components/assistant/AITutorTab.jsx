import { useState, useEffect, useRef } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import { Send, Plus, X, Sparkles, Loader2, FileText } from 'lucide-react';

const SUGGESTIONS = [
  'Summarize the key concepts',
  'Explain this topic simply with an example',
  'Compare the main models or methods',
  'What should I remember for an exam?',
];

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="bg-[#121212] text-[#FF841C] px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function FormattedReply({ content }) {
  const lines = (content || '').split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (!line.trim() || line.trim() === '---') {
      i++;
      continue;
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const tableRows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const raw = lines[i].trim();
        if (!/^\|[\s\-:|]+\|$/.test(raw)) {
          tableRows.push(raw.slice(1, -1).split('|').map((c) => c.trim()));
        }
        i++;
      }
      if (tableRows.length > 0) {
        const [header, ...body] = tableRows;
        elements.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded-xl border border-[#2E2E32]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#121212] text-white">
                <tr>
                  {header.map((h, hi) => (
                    <th key={hi} className="px-3 py-2 font-semibold border-b border-[#2E2E32]">{renderInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E32]">
                {body.map((row, ri) => (
                  <tr key={ri} className="bg-[#1A1A1A]">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-[#D1D5DB] align-top">{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch) {
      elements.push(
        <h4 key={`h-${i}`} className="text-white font-bold text-sm mt-3 mb-1.5">
          {renderInline(hMatch[2])}
        </h4>
      );
      i++;
      continue;
    }

    if (/^[-*•]\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-1.5 text-[#D1D5DB]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-1.5 text-[#D1D5DB]">
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-[#D1D5DB] leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="text-sm">{elements}</div>;
}

export default function AITutorTab({ selectedDocId, onDocChange }) {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);
  const bottomRef = useRef(null);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await documentApi.getDocuments();
        setDocuments(res.data.filter((d) => d.status === 'ready'));
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
      setError(err.response?.data?.detail || 'DayDive AI could not respond. Try again.');
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUpload = () => {
    if (uploading) return;
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = 'application/pdf';
    el.onchange = async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are supported.');
        return;
      }
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await documentApi.upload(formData);
        setDocuments((prev) => [res.data, ...prev]);
        if (res.data?.id) onDocChange?.(res.data.id);
      } catch (err) {
        setError(err.response?.data?.detail || 'Upload failed.');
      } finally {
        setUploading(false);
      }
    };
    el.click();
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
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedDoc ? (
            <div className="flex items-center gap-2 bg-[#232325] border border-[#2E2E32] rounded-full px-3 py-1.5">
              <FileText size={14} className="text-[#FF841C]" />
              <span className="text-white text-xs font-medium truncate max-w-[240px]">
                {selectedDoc.filename} · pp. 1–{selectedDoc.page_count}
              </span>
              <button
                type="button"
                onClick={() => onDocChange?.(null)}
                className="text-[#8E8E93] hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => e.target.value && handleSelectDoc(Number(e.target.value))}
              className="bg-[#232325] border border-[#2E2E32] rounded-full px-3.5 py-1.5 text-xs text-[#D1D5DB] focus:outline-none focus:border-[#FF841C]"
            >
              <option value="">+ Attach study material</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
          )}
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={clearChat}
            className="text-[#8E8E93] hover:text-white text-xs font-medium px-3 py-1.5 rounded-full border border-[#2E2E32] hover:border-[#8E8E93]/50 transition"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto card p-6 mb-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="text-[#FF841C]" size={26} />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">
              Where should we start?
            </h2>
            <p className="text-[#8E8E93] text-sm mb-8 max-w-md">
              {selectedDoc
                ? `Ask anything from ${selectedDoc.filename}.`
                : 'Ask DayDive AI anything — or attach study material for grounded answers.'}
            </p>

            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="px-4 py-2 rounded-full border border-[#2E2E32] bg-[#232325] text-[#D1D5DB] text-sm hover:border-[#FF841C]/50 hover:text-white transition"
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
                {m.role === 'user' ? (
                  <div className="max-w-[80%] rounded-[14px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-[#E66A10] text-white font-medium">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[88%] rounded-[14px] px-5 py-4 bg-[#232325] border border-[#2E2E32]">
                    <FormattedReply content={m.content} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#FF841C]" />
                  <span className="text-[#8E8E93] text-sm">DayDive AI is thinking…</span>
                </div>
              </div>
            )}

            {sources.length > 0 && !loading && (
              <div className="pt-3 border-t border-[#2E2E32]">
                <p className="text-[#8E8E93] text-xs mb-2">Sources from your material:</p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, i) => (
                    <span
                      key={i}
                      className="text-[#D1D5DB] bg-[#232325] text-xs px-2.5 py-1 rounded-full border border-[#2E2E32]"
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
        <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-[14px] mb-3 text-xs flex-shrink-0">
          {error}
        </div>
      )}

      <div className="flex-shrink-0">
        <div className="bg-[#1A1A1A] rounded-[20px] border border-[#2E2E32] focus-within:border-[#FF841C]/60 flex items-end gap-2 p-2 pl-3 transition">
          <button
            type="button"
            disabled={uploading}
            onClick={handleQuickUpload}
            className="p-2 rounded-full text-[#8E8E93] hover:text-white hover:bg-[#232325] transition flex-shrink-0 disabled:opacity-40"
            title="Upload PDF material"
          >
            {uploading ? <Loader2 size={18} className="animate-spin text-[#FF841C]" /> : <Plus size={18} />}
          </button>

          {selectedDoc && (
            <span className="text-white bg-[#232325] border border-[#2E2E32] text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 flex-shrink-0 mb-1">
              <FileText size={12} className="text-[#FF841C]" />
              <span className="max-w-[120px] truncate">{selectedDoc.filename}</span>
            </span>
          )}

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDoc ? 'Ask DayDive AI about your material…' : 'Ask DayDive AI anything…'}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#8E8E93] focus:outline-none resize-none py-3 px-1 max-h-[120px]"
            style={{ minHeight: '40px' }}
          />

          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#E66A10] hover:bg-[#FF841C] text-[#121212] flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-center text-[#8E8E93] text-[11px] mt-3">
          DayDive AI uses Groq RAG to answer strictly based on your uploaded document text.
        </p>
      </div>
    </div>
  );
}