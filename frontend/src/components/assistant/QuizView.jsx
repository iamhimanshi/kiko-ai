import { useState, useEffect } from 'react';
import { documentApi, assistantApi } from '../../services/api';
import PagesSelector from './PagesSelector';
import { ArrowLeft, Sparkles, Loader2, Check, X, RotateCcw } from 'lucide-react';

const COUNTS = [5, 10, 15, 20];
const DIFFS = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function QuizView({ onBack, initialDocId }) {
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

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

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
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition text-sm"
        >
          <ArrowLeft size={16} /> Back to Practice
        </button>

        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📝</span>
            <h2 className="text-lg font-semibold text-[#1F2937]">Create Quiz</h2>
          </div>
          <p className="text-[#6B7280] text-sm mb-5">Test your understanding with MCQs.</p>

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
            <label className="block text-[#4B5563] text-sm font-medium mb-1.5">Questions</label>
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
                Preparing your quiz...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Quiz
              </>
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
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-1">Quiz Complete</h2>
          <div className="text-4xl font-bold text-[#1B4332] my-4">
            {score} / {questions.length}
          </div>
          <p className="text-[#6B7280] text-sm mb-6">{percentage}%</p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
            <div className="bg-[#EAF8EC] rounded-[14px] p-3">
              <p className="text-2xl font-bold text-[#2E7D32]">{score}</p>
              <p className="text-[#4B5563] text-xs">Correct</p>
            </div>
            <div className="bg-[#FDECEC] rounded-[14px] p-3">
              <p className="text-2xl font-bold text-[#D14343]">
                {questions.length - score}
              </p>
              <p className="text-[#4B5563] text-xs">Incorrect</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={retry}
              className="flex-1 bg-white border border-[#E8ECE7] hover:bg-[#EDF4EE] text-[#4B5563] py-3 rounded-[14px] font-medium transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <button
              onClick={reset}
              className="flex-1 bg-[#1B4332] hover:bg-[#24543F] text-white py-3 rounded-[14px] font-medium transition"
            >
              New Quiz
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Review Answers</h3>
          <div className="space-y-4">
            {questions.map((q, i) => {
              const user = answers[i];
              const correct = user === q.correct_index;
              return (
                <div key={i} className="border-b border-[#E8ECE7]/60 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      correct ? 'bg-[#EAF8EC]' : 'bg-[#FDECEC]'
                    }`}>
                      {correct
                        ? <Check size={12} className="text-[#2E7D32]" />
                        : <X size={12} className="text-[#D14343]" />}
                    </div>
                    <p className="text-[#1F2937] text-sm font-medium">
                      Q{i + 1}. {q.question}
                    </p>
                  </div>
                  <div className="ml-7 space-y-1 text-xs">
                    <p className="text-[#6B7280]">
                      Your answer:{' '}
                      <span className={correct ? 'text-[#2E7D32] font-medium' : 'text-[#D14343] font-medium'}>
                        {user != null ? q.options[user] : '—'}
                      </span>
                    </p>
                    {!correct && (
                      <p className="text-[#6B7280]">
                        Correct answer:{' '}
                        <span className="text-[#2E7D32] font-medium">
                          {q.options[q.correct_index]}
                        </span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-[#6B7280] italic mt-1">{q.explanation}</p>
                    )}
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition text-sm"
        >
          <ArrowLeft size={16} /> Exit Quiz
        </button>
        <span className="text-[#6B7280] text-sm">
          Question {index + 1} / {questions.length}
        </span>
      </div>

      <div className="w-full h-1 bg-[#EDF4EE] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1B4332] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
        <p className="text-[#1F2937] text-lg font-semibold leading-relaxed mb-6">
          {q.question}
        </p>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectOption(i)}
              className={`w-full text-left px-4 py-3 rounded-[14px] border transition flex items-center gap-3 ${
                user === i
                  ? 'bg-[#1B4332] border-[#1B4332] text-white'
                  : 'bg-white border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
              }`}
            >
              <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                user === i ? 'border-white/40 bg-white/10' : 'border-[#E8ECE7]'
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
          onClick={handlePrev}
          disabled={index === 0}
          className="text-[#4B5563] hover:text-[#1B4332] px-4 py-2.5 rounded-[14px] border border-[#E8ECE7] bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={user == null}
          className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-2.5 rounded-[14px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {index === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
