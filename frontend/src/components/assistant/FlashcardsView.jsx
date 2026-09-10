import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import PagesSelector from './PagesSelector';
import {
  ArrowLeft, Sparkles, Loader2, ChevronLeft, ChevronRight,
  RotateCcw, Check,
} from 'lucide-react';

const COUNTS = [5, 10, 15, 20];
const DIFFS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function FlashcardsView({ onBack, initialDocId }) {
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
    const load = async () => {
      try {
        const res = await documentApi.getDocuments();
        const ready = res.data.filter((d) => d.status === 'ready');
        setDocuments(ready);
        if (!docId && ready.length > 0) {
          setDocId(ready[0].id);
        }
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
    setSelectedPages((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  const buildPagesPayload = () => {
    if (!doc) return null;
    if (pagesMode === 'all') return null;
    if (pagesMode === 'range') {
      const s = Math.max(1, Math.min(rangeStart, doc.page_count));
      const e = Math.max(s, Math.min(rangeEnd, doc.page_count));
      const arr = [];
      for (let i = s; i <= e; i++) arr.push(i);
      return arr;
    }
    return selectedPages.sort((a, b) => a - b);
  };

  const handleGenerate = async () => {
    setError('');
    if (!docId) { setError('Select a document first.'); return; }
    const pages = buildPagesPayload();
    if (pagesMode !== 'all' && (!pages || pages.length === 0)) {
      setError('Select at least one page.');
      return;
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
      setIndex(cards.length); // triggers "complete" view
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

  // ---- Setup view ----
  if (!cards) {
    return (
      <div className="space-y-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition text-sm"
        >
          <ArrowLeft size={16} /> Back to Practice
        </button>

        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <h2 className="text-lg font-semibold text-[#1F2937]">Create Flashcards</h2>
          </div>
          <p className="text-[#6B7280] text-sm mb-5">
            Test your memory with active recall.
          </p>

          {error && (
            <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[#4B5563] text-sm font-medium mb-1.5">Document</label>
            {documents.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm">Upload a document first.</p>
            ) : (
              <select
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
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

          {doc && (
            <div className="mb-5">
              <label className="block text-[#4B5563] text-sm font-medium mb-1.5">Pages</label>
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
            <label className="block text-[#4B5563] text-sm font-medium mb-1.5">Number of cards</label>
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCount(c)}
                  className={`py-2.5 rounded-[14px] text-sm font-medium transition ${
                    count === c
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[#4B5563] text-sm font-medium mb-1.5">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`py-2.5 rounded-[14px] text-sm font-medium transition ${
                    difficulty === d.id
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !docId}
            className="w-full bg-[#1B4332] hover:bg-[#24543F] text-white font-semibold py-3 rounded-[14px] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating your flashcards...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ---- Complete view ----
  if (index >= cards.length) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-1">Deck complete</h2>
          <p className="text-[#6B7280] text-sm mb-6">
            You reviewed {cards.length} cards.
          </p>
          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 bg-white border border-[#E8ECE7] hover:bg-[#EDF4EE] text-[#4B5563] py-3 rounded-[14px] font-medium transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Practice Again
            </button>
            <button
              onClick={newSet}
              className="flex-1 bg-[#1B4332] hover:bg-[#24543F] text-white py-3 rounded-[14px] font-medium transition flex items-center justify-center gap-2"
            >
              <Sparkles size={16} /> New Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Card view ----
  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition text-sm"
        >
          <ArrowLeft size={16} /> Back to Practice
        </button>
        <span className="text-[#6B7280] text-sm">
          Card {index + 1} / {cards.length}
        </span>
      </div>

      <div className="w-full h-1 bg-[#EDF4EE] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1B4332] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 min-h-[340px] flex flex-col items-center justify-center text-center">
        <p className="text-[#9CA3AF] text-xs uppercase tracking-wider font-medium mb-4">
          Question
        </p>
        <p className="text-[#1F2937] text-xl font-semibold leading-relaxed mb-6 max-w-xl">
          {card.question}
        </p>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-2.5 rounded-[14px] font-medium transition"
          >
            Show Answer
          </button>
        ) : (
          <div className="w-full max-w-xl">
            <div className="border-t border-[#E8ECE7] my-5"></div>
            <p className="text-[#9CA3AF] text-xs uppercase tracking-wider font-medium mb-3">
              Answer
            </p>
            <p className="text-[#4B5563] text-base leading-relaxed">{card.answer}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="flex items-center gap-2 text-[#4B5563] hover:text-[#1B4332] px-4 py-2.5 rounded-[14px] border border-[#E8ECE7] bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-[#1B4332] hover:bg-[#24543F] text-white px-5 py-2.5 rounded-[14px] font-medium transition"
        >
          {index === cards.length - 1 ? (
            <>
              <Check size={16} /> Finish
            </>
          ) : (
            <>
              Next <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
