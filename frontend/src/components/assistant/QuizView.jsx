import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import PagesSelector from './PagesSelector';
import { ArrowLeft, Sparkles, Loader2, Check, X, RotateCcw, ClipboardCheck, Award } from 'lucide-react';

const COUNTS = [5, 10, 15, 20];
const DIFFS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function QuizView({ onBack, initialDocId, initialRecord }) {
  const [documents, setDocuments] = useState([]);
  const [docId, setDocId] = useState(initialDocId || '');
  const [pagesMode, setPagesMode] = useState('all');
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [selectedPages, setSelectedPages] = useState([]);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');

  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showReview, setShowReview] = useState(false);

  const doc = documents.find((d) => Number(d.id) === Number(docId));

  useEffect(() => {
    if (initialRecord && Array.isArray(initialRecord.data)) {
      setQuestions(initialRecord.data);
      setAnswers(new Array(initialRecord.data.length).fill(null));
      setIndex(0);
      setShowReview(false);
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
      const res = await assistantApi.quiz({
        document_id: Number(docId),
        pages,
        count,
        difficulty,
      });
      setQuestions(res.data.questions);
      setAnswers(new Array(res.data.questions.length).fill(null));
      setIndex(0);
      setShowReview(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (optionIndex) => {
    const next = [...answers];
    next[index] = optionIndex;
    setAnswers(next);
  };

  const handleNext = () => {
    if (index < questions.length - 1) setIndex(index + 1);
    else setShowReview(true);
  };

  const handlePrev = () => { if (index > 0) setIndex(index - 1); };

  const reset = () => {
    setQuestions(null);
    setAnswers([]);
    setIndex(0);
    setShowReview(false);
  };

  const retry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setIndex(0);
    setShowReview(false);
  };

  const score = questions
    ? answers.reduce((acc, a, i) => acc + (a === questions[i].correct_index ? 1 : 0), 0)
    : 0;

  if (!questions) {
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
            <ClipboardCheck size={20} className="text-[#10B981]" />
            <h2 className="text-lg font-bold text-white">Create Quiz</h2>
          </div>
          <p className="text-[#8E8E93] text-sm mb-5">Test your understanding with MCQs.</p>

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
            <label className="block text-white text-sm font-semibold mb-1.5">Questions</label>
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
              <><Loader2 size={18} className="animate-spin" /> Preparing your quiz...</>
            ) : (
              <><Sparkles size={18} /> Generate Quiz</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (showReview) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5">
        <div className="card p-8 text-center">
          <div className="w-12 h-12 bg-[#0F2922] border border-[#10B981]/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Award size={24} className="text-[#10B981]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Quiz Complete</h2>
          <div className="text-4xl font-extrabold text-[#FF841C] my-4">
            {score} / {questions.length}
          </div>
          <p className="text-[#8E8E93] text-sm mb-6">{percentage}% accuracy</p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
            <div className="bg-[#0F2922] border border-[#10B981]/30 rounded-[14px] p-3">
              <p className="text-2xl font-extrabold text-[#10B981]">{score}</p>
              <p className="text-[#8E8E93] text-xs">Correct</p>
            </div>
            <div className="bg-[#2D1616] border border-[#EF4444]/30 rounded-[14px] p-3">
              <p className="text-2xl font-extrabold text-[#EF4444]">{questions.length - score}</p>
              <p className="text-[#8E8E93] text-xs">Incorrect</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={retry} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Try Again
            </button>
            <button type="button" onClick={reset} className="flex-1 btn-primary py-3">
              New Quiz
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Review Answers</h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const user = answers[i];
              const correct = user === q.correct_index;
              return (
                <div key={i} className="border-b border-[#2E2E32] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      correct ? 'bg-[#0F2922]' : 'bg-[#2D1616]'
                    }`}>
                      {correct ? <Check size={12} className="text-[#10B981]" /> : <X size={12} className="text-[#EF4444]" />}
                    </div>
                    <p className="text-white text-sm font-semibold">Q{i + 1}. {q.question}</p>
                  </div>
                  <div className="ml-7 space-y-1 text-xs">
                    <p className="text-[#8E8E93]">
                      Your answer:{' '}
                      <span className={correct ? 'text-[#10B981] font-semibold' : 'text-[#EF4444] font-semibold'}>
                        {user != null ? q.options[user] : '—'}
                      </span>
                    </p>
                    {!correct && (
                      <p className="text-[#8E8E93]">
                        Correct answer: <span className="text-[#10B981] font-semibold">{q.options[q.correct_index]}</span>
                      </p>
                    )}
                    {q.explanation && <p className="text-[#D1D5DB] italic mt-1">{q.explanation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const user = answers[index];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition text-sm font-medium">
          <ArrowLeft size={16} /> Exit Quiz
        </button>
        <span className="text-[#8E8E93] text-sm font-medium">Question {index + 1} / {questions.length}</span>
      </div>

      <div className="w-full h-1.5 bg-[#232325] rounded-full overflow-hidden">
        <div className="h-full bg-[#FF841C] rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="card p-6">
        <p className="text-white text-lg font-bold leading-relaxed mb-6">{q.question}</p>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectOption(i)}
              className={`w-full text-left px-4 py-3 rounded-[14px] border transition flex items-center gap-3 ${
                user === i
                  ? 'bg-[#E66A10] border-[#E66A10] text-white font-semibold'
                  : 'bg-[#232325] border-[#2E2E32] text-[#D1D5DB] hover:border-[#FF841C]/50'
              }`}
            >
              <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                user === i ? 'border-white/40 bg-white/15 text-white' : 'border-[#2E2E32] text-[#8E8E93]'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          className="btn-secondary px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={user == null}
          className="btn-primary px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {index === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
