import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import { Sparkles, Copy, Check, Loader2, BookOpen, FileText } from 'lucide-react';

const STYLES = [
  { id: 'quick',    label: 'Quick Summary',    desc: '4–6 sentences',           icon: '⚡' },
  { id: 'detailed', label: 'Detailed Summary', desc: 'Structured coverage',     icon: '📖' },
  { id: 'points',   label: 'Important Points', desc: '8–12 exam-ready bullets', icon: '📌' },
];

export default function QuickRevisionTab({ initialDocId }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [style, setStyle] = useState('quick');
  const [pagesMode, setPagesMode] = useState('all'); // 'all' | 'range' | 'individual'
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [selectedPages, setSelectedPages] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedDoc = documents.find((d) => Number(d.id) === Number(selectedDocId));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await documentApi.getDocuments();
        const ready = res.data.filter((d) => d.status === 'ready');
        setDocuments(ready);
        if (!selectedDocId && ready.length > 0) {
          setSelectedDocId(ready[0].id);
          setRangeStart(1);
          setRangeEnd(ready[0].page_count);
        }
      } catch {
        setError('Could not load your documents.');
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialDocId) setSelectedDocId(initialDocId);
  }, [initialDocId]);

  useEffect(() => {
    if (selectedDoc) {
      setRangeStart(1);
      setRangeEnd(selectedDoc.page_count);
      setSelectedPages([]);
      setPagesMode('all');
    }
  }, [selectedDocId]);

  const buildPagesPayload = () => {
    if (!selectedDoc) return null;
    if (pagesMode === 'all') return null;
    if (pagesMode === 'range') {
      const s = Math.max(1, Math.min(rangeStart, selectedDoc.page_count));
      const e = Math.max(s, Math.min(rangeEnd, selectedDoc.page_count));
      const arr = [];
      for (let i = s; i <= e; i++) arr.push(i);
      return arr;
    }
    return selectedPages.sort((a, b) => a - b);
  };

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError('Please select a document.');
      return;
    }
    const pages = buildPagesPayload();
    if (pagesMode !== 'all' && (!pages || pages.length === 0)) {
      setError('Please select at least one page.');
      return;
    }
    setError('');
    setLoading(true);
    setSummary('');
    try {
      const res = await assistantApi.summarize({
        document_id: Number(selectedDocId),
        style,
        pages,
      });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  const togglePage = (n) => {
    setSelectedPages((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[#D4A64A]" />
          <h2 className="text-lg font-semibold text-[#1F2937]">Quick Revision</h2>
        </div>
        <p className="text-[#6B7280] text-sm mb-5">
          Turn your study material into clear, exam-ready understanding.
        </p>

        {error && (
          <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Document */}
        <div className="mb-5">
          <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
            Study Material
          </label>
          {documents.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">
              No documents available. Upload one in the Documents tab first.
            </p>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-white border border-[#E8ECE7] rounded-[14px] px-4 py-3 text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all text-sm"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} · {d.page_count} pages
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Pages */}
        {selectedDoc && (
          <div className="mb-5">
            <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
              Pages
            </label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {['all', 'range', 'individual'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPagesMode(m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    pagesMode === m
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                  }`}
                >
                  {m === 'all' ? `Entire document (${selectedDoc.page_count})` : m === 'range' ? 'Page range' : 'Pick pages'}
                </button>
              ))}
            </div>

            {pagesMode === 'range' && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={selectedDoc.page_count}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-20 bg-white border border-[#E8ECE7] rounded-[12px] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#1B4332]"
                />
                <span className="text-[#9CA3AF] text-sm">to</span>
                <input
                  type="number"
                  min="1"
                  max={selectedDoc.page_count}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-20 bg-white border border-[#E8ECE7] rounded-[12px] px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:border-[#1B4332]"
                />
                <span className="text-[#9CA3AF] text-xs">of {selectedDoc.page_count}</span>
              </div>
            )}

            {pagesMode === 'individual' && (
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                {Array.from({ length: selectedDoc.page_count }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => togglePage(n)}
                    className={`w-9 h-9 rounded-[10px] text-xs font-medium transition ${
                      selectedPages.includes(n)
                        ? 'bg-[#1B4332] text-white'
                        : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Style */}
        <div className="mb-6">
          <label className="block text-[#4B5563] text-sm font-medium mb-1.5">
            Revision Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`p-3 rounded-[14px] text-left transition border ${
                  style === s.id
                    ? 'bg-[#1B4332] border-[#1B4332] text-white'
                    : 'bg-white border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                }`}
              >
                <p className="font-medium text-sm">{s.icon} {s.label}</p>
                <p className={`text-xs mt-0.5 ${style === s.id ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                  {s.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedDocId}
          className="w-full bg-[#1B4332] hover:bg-[#24543F] text-white font-semibold py-3 rounded-[14px] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              KIKO is reading your material...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {(summary || loading) && (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1F2937]">
              {style === 'points' ? 'Important Points' : style === 'detailed' ? 'Detailed Summary' : 'Quick Summary'}
            </h3>
            {summary && (
              <button
                onClick={handleCopy}
                className="text-[#1B4332] text-sm font-medium flex items-center gap-1.5 hover:underline"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-[#F8F7F2] rounded-[14px] p-6">
              <div className="flex items-center gap-2 text-[#6B7280] text-sm mb-3">
                <Loader2 size={16} className="animate-spin text-[#1B4332]" />
                Extracting the important concepts...
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#E8ECE7] rounded animate-pulse w-full"></div>
                <div className="h-3 bg-[#E8ECE7] rounded animate-pulse w-5/6"></div>
                <div className="h-3 bg-[#E8ECE7] rounded animate-pulse w-4/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F8F7F2] rounded-[14px] p-5 text-[#4B5563] text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
