import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import PagesSelector from './PagesSelector';
import { Sparkles, Copy, Check, Loader2, Zap, BookOpen, ListChecks } from 'lucide-react';

const STYLES = [
  { id: 'quick',    label: 'Quick Summary',    desc: '5–7 clear sentences',     icon: Zap },
  { id: 'detailed', label: 'Detailed Summary', desc: 'Structured breakdown',    icon: BookOpen },
  { id: 'points',   label: 'Important Points', desc: '10–14 exam bullets',      icon: ListChecks },
];

export default function QuickRevisionTab({ initialDocId }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || '');
  const [style, setStyle] = useState('quick');
  const [pagesMode, setPagesMode] = useState('all');
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

  useEffect(() => { if (initialDocId) setSelectedDocId(initialDocId); }, [initialDocId]);

  useEffect(() => {
    if (selectedDoc) {
      setRangeStart(1);
      setRangeEnd(selectedDoc.page_count);
      setSelectedPages([]);
      setPagesMode('all');
    }
  }, [selectedDocId]);

  const buildPagesPayload = () => {
    if (!selectedDoc || pagesMode === 'all') return null;
    if (pagesMode === 'range') {
      const s = Math.max(1, Math.min(rangeStart, selectedDoc.page_count));
      const e = Math.max(s, Math.min(rangeEnd, selectedDoc.page_count));
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    }
    return [...selectedPages].sort((a, b) => a - b);
  };

  const handleGenerate = async () => {
    if (!selectedDocId) return setError('Please select a document.');
    const pages = buildPagesPayload();
    if (pagesMode !== 'all' && (!pages || pages.length === 0)) {
      return setError('Please select at least one page.');
    }
    setError('');
    setLoading(true);
    setSummary('');
    try {
      const res = await assistantApi.summarize({ document_id: Number(selectedDocId), style, pages });
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
    setSelectedPages((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-[#FF841C]" />
          <h2 className="text-lg font-bold text-white">Quick Revision</h2>
        </div>
        <p className="text-[#8E8E93] text-sm mb-5">
          Turn your study material into clear, exam-ready understanding.
        </p>

        {error && (
          <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-white text-sm font-semibold mb-1.5">Study Material</label>
          {documents.length === 0 ? (
            <p className="text-[#8E8E93] text-sm">No documents available. Upload one in the Documents tab first.</p>
          ) : (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="input-field text-sm"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>{d.filename} · {d.page_count} pages</option>
              ))}
            </select>
          )}
        </div>

        {selectedDoc && (
          <div className="mb-5">
            <label className="block text-white text-sm font-semibold mb-1.5">Pages</label>
            <PagesSelector
              pageCount={selectedDoc.page_count}
              mode={pagesMode}
              setMode={setPagesMode}
              rangeStart={rangeStart}
              setRangeStart={setRangeStart}
              rangeEnd={rangeEnd}
              setRangeEnd={setRangeEnd}
              selectedPages={selectedPages}
              togglePage={togglePage}
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-white text-sm font-semibold mb-1.5">Revision Style</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {STYLES.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-3.5 rounded-[14px] text-left transition border ${
                    style === s.id
                      ? 'bg-[#E66A10] border-[#E66A10] text-white'
                      : 'bg-[#232325] border-[#2E2E32] text-[#D1D5DB] hover:border-[#FF841C]/50'
                  }`}
                >
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <Icon size={15} /> {s.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${style === s.id ? 'text-white/80' : 'text-[#8E8E93]'}`}>{s.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !selectedDocId}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> DayDive AI is reading your material...</>
          ) : (
            <><Sparkles size={18} /> Generate Revision</>
          )}
        </button>
      </div>

      {(summary || loading) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              {style === 'points' ? 'Important Points' : style === 'detailed' ? 'Detailed Summary' : 'Quick Summary'}
            </h3>
            {summary && (
              <button type="button" onClick={handleCopy} className="text-[#FF841C] text-sm font-semibold flex items-center gap-1.5 hover:underline">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-6">
              <div className="flex items-center gap-2 text-[#8E8E93] text-sm mb-3">
                <Loader2 size={16} className="animate-spin text-[#FF841C]" />
                Extracting the important concepts...
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[#2E2E32] rounded animate-pulse w-full"></div>
                <div className="h-3 bg-[#2E2E32] rounded animate-pulse w-5/6"></div>
                <div className="h-3 bg-[#2E2E32] rounded animate-pulse w-4/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-5 text-[#D1D5DB] text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}