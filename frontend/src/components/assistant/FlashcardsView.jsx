import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import PagesSelector from './PagesSelector';
import {
  ArrowLeft, Sparkles, Loader2, ChevronLeft, ChevronRight,
  RotateCcw, Check, Brain, Award,
} from 'lucide-react';

const COUNTS = [5, 10, 15, 20];
const DIFFS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function FlashcardsView({ onBack, initialDocId, initialRecord }) {
  const [documents, setDocuments] = useState([]);
  const [docId, setDocId] = useState(initialDocId || '');
  const [pagesMode, setPagesMode] = useState('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [selectedPages, setSelectedPages] = useState([]);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');

  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(new Set());

  const doc = documents.find((d) => Number(d.id) === Number(docId));

  useEffect(() => {
    if (initialRecord && Array.isArray(initialRecord.data)) {
      setCards(initialRecord.data);
      setIndex(0);
      setRevealed(false);
      setReviewed(new Set());
    }
  }, [initialRecord]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await documentApi.getDocuments();
        const ready = res.data.filter((d) => d.status === 'ready');
        setDocuments(ready);
        if (!docId && ready.length > 0) setDocId(ready[0].id);
      } catch { /* */ }
    };
    load();
  }, []);

  useEffect(() => {
    if (doc) {
      setRangeStart(1);
      setRangeEnd(doc.page_count);
      setSelectedPages([]);
      setPagesMode('all');
    }
  }, [docId]);

  const togglePage = (n) =>
    setSelectedPages((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const buildPagesPayload = () => {
    if (!doc || pagesMode === 'all') return null;
    if (pagesMode === 'range') {
      const s = Math.max(1, Math.min(rangeStart, doc.page_count));
      const e = Math.max(s, Math.min(rangeEnd, doc.page_count));
      return Array.from({ length: e - s + 1 }, (_, i) => s + i);
    }
    return [...selectedPages].sort((a, b) => a - b);
  };

  const handleGenerate = async () => {
    setError('');
    if (!docId) return setError('Select a document first.');
    const pages = buildPagesPayload();
    if (pagesMode !== 'all' && (!pages || pages.length === 0)) {
      return setError('Select at least one page.');
    }
    setLoading(true);
    try {
      const res = await assistantApi.flashcards({
        document_id: Number(docId),
        pages,
        count,
        difficulty,
      });
      setCards(res.data.cards);
      setIndex(0);
      setRevealed(false);
      setReviewed(new Set());
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!cards) return;
    setReviewed((prev) => new Set(prev).add(index));
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setRevealed(false);
    } else {
      setRevealed(false);
      setIndex(cards.length);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setRevealed(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setRevealed(false);
    setReviewed(new Set());
  };

  const newSet = () => {
    setCards(null);
    setIndex(0);
    setRevealed(false);
    setReviewed(new Set());
  };

  if (!cards) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Practice
        </button>

        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-1">
            <Brain size={20} className="text-[#FF841C]" />
            <h2 className="text-lg font-bold text-white">Create Flashcards</h2>
          </div>
          <p className="text-[#8E8E93] text-sm mb-5">Test your memory with active recall.</p>

          {error && (
            <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-white text-sm font-semibold mb-1.5">Document</label>
            {documents.length === 0 ? (
              <p className="text-[#8E8E93] text-sm">Upload a document first.</p>
            ) : (
              <select value={docId} onChange={(e) => setDocId(e.target.value)} className="input-field text-sm">
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.filename} · {d.page_count} pages</option>
                ))}
              </select>
            )}
          </div>

          {doc && (
            <div className="mb-5">
              <label className="block text-white text-sm font-semibold mb-1.5">Pages</label>
              <PagesSelector
                pageCount={doc.page_count}
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

          <div className="mb-5">
            <label className="block text-white text-sm font-semibold mb-1.5">Number of cards</label>
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  className={`py-2.5 rounded-[14px] text-sm font-semibold transition ${
                    count === c
                      ? 'bg-[#E66A10] text-white'
                      : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white text-sm font-semibold mb-1.5">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`py-2.5 rounded-[14px] text-sm font-semibold transition ${
                    difficulty === d.id
                      ? 'bg-[#E66A10] text-white'
                      : 'bg-[#232325] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !docId}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Creating your flashcards...</>
            ) : (
              <><Sparkles size={18} /> Generate Flashcards</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (index >= cards.length) {
    return (
      <div className="space-y-5">
        <div className="card p-8 text-center">
          <div className="w-12 h-12 bg-[#0F2922] border border-[#10B981]/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award size={24} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Deck complete</h2>
          <p className="text-[#8E8E93] text-sm mb-6">You reviewed {cards.length} cards.</p>
          <div className="flex gap-3">
            <button type="button" onClick={restart} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Practice Again
            </button>
            <button type="button" onClick={newSet} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
              <Sparkles size={16} /> New Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition text-sm font-medium">
          <ArrowLeft size={16} /> Back to Practice
        </button>
        <span className="text-[#8E8E93] text-sm font-medium">Card {index + 1} / {cards.length}</span>
      </div>

      <div className="w-full h-1.5 bg-[#232325] rounded-full overflow-hidden">
        <div className="h-full bg-[#FF841C] rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="card p-8 min-h-[340px] flex flex-col items-center justify-center text-center">
        <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-4">Question</p>
        <p className="text-white text-xl font-bold leading-relaxed mb-6 max-w-xl">{card.question}</p>

        {!revealed ? (
          <button type="button" onClick={() => setRevealed(true)} className="btn-primary px-6 py-2.5">
            Show Answer
          </button>
        ) : (
          <div className="w-full max-w-xl">
            <div className="border-t border-[#2E2E32] my-5"></div>
            <p className="text-[#FF841C] text-xs uppercase tracking-wider font-bold mb-3">Answer</p>
            <p className="text-[#D1D5DB] text-base leading-relaxed">{card.answer}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          className="btn-secondary px-4 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button type="button" onClick={handleNext} className="btn-primary px-5 py-2.5 flex items-center gap-2">
          {index === cards.length - 1 ? <><Check size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}