import { useState, useEffect } from 'react';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';
import { assistantApi } from '../../services/api';
import { ArrowRight, Clock, Trash2, Loader2, Brain, ClipboardCheck } from 'lucide-react';

export default function PracticeTab() {
  const [view, setView] = useState('hub');
  const [resumeRecord, setResumeRecord] = useState(null);
  const [fcHistory, setFcHistory] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const [fc, qz] = await Promise.all([
        assistantApi.practiceHistory('flashcards', 5),
        assistantApi.practiceHistory('quiz', 5),
      ]);
      setFcHistory(fc.data);
      setQuizHistory(qz.data);
    } catch { /* */ }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { loadHistory(); }, [view]);

  const openRecord = (record) => {
    setResumeRecord(record);
    setView(record.type === 'flashcards' ? 'flashcards' : 'quiz');
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this practice record?')) return;
    try {
      await assistantApi.practiceDelete(id);
      setFcHistory((p) => p.filter((r) => r.id !== id));
      setQuizHistory((p) => p.filter((r) => r.id !== id));
    } catch { /* */ }
  };

  const closeView = () => {
    setResumeRecord(null);
    setView('hub');
  };

  if (view === 'flashcards') return <FlashcardsView onBack={closeView} initialRecord={resumeRecord} />;
  if (view === 'quiz') return <QuizView onBack={closeView} initialRecord={resumeRecord} />;

  const formatDate = (iso) => {
    const d = new Date(iso);
    const diffMs = new Date() - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  const HistoryItem = ({ record }) => (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#232325] border border-[#2E2E32] rounded-[12px] hover:border-[#FF841C]/40 transition group">
      <button type="button" onClick={() => openRecord(record)} className="flex-1 text-left min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {record.document_name || 'Untitled material'}
        </p>
        <div className="flex items-center gap-2 text-[#8E8E93] text-xs mt-0.5">
          <span>{record.count} {record.type === 'quiz' ? 'Q' : 'cards'}</span>
          <span className="w-1 h-1 bg-[#2E2E32] rounded-full"></span>
          <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(record.created_at)}</span>
        </div>
      </button>
      <button
        type="button"
        onClick={() => deleteRecord(record.id)}
        className="text-[#8E8E93] hover:text-[#EF4444] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center pt-2">
        <h2 className="text-2xl font-extrabold text-white">Practice</h2>
        <p className="text-[#8E8E93] text-sm mt-1">What would you like to practice today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={() => { setResumeRecord(null); setView('flashcards'); }}
          className="card p-8 text-left group"
        >
          <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mb-4">
            <Brain size={24} className="text-[#FF841C]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Flashcards</h3>
          <p className="text-[#8E8E93] text-sm mb-5">Test your memory with active recall.</p>
          <span className="inline-flex items-center gap-1.5 text-[#FF841C] text-sm font-semibold group-hover:gap-2.5 transition-all">
            Create new <ArrowRight size={14} />
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setResumeRecord(null); setView('quiz'); }}
          className="card p-8 text-left group"
        >
          <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mb-4">
            <ClipboardCheck size={24} className="text-[#10B981]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Quiz</h3>
          <p className="text-[#8E8E93] text-sm mb-5">Test your understanding with MCQs.</p>
          <span className="inline-flex items-center gap-1.5 text-[#FF841C] text-sm font-semibold group-hover:gap-2.5 transition-all">
            Create new <ArrowRight size={14} />
          </span>
        </button>
      </div>

      {historyLoading ? (
        <div className="flex items-center justify-center py-8 text-[#8E8E93] text-sm gap-2">
          <Loader2 size={16} className="animate-spin text-[#FF841C]" /> Loading history...
        </div>
      ) : (fcHistory.length > 0 || quizHistory.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Brain size={15} className="text-[#FF841C]" /> Recent Flashcard Decks
            </h3>
            {fcHistory.length === 0 ? (
              <p className="text-[#8E8E93] text-xs py-3">No flashcard decks yet.</p>
            ) : (
              <div className="space-y-2">{fcHistory.map((r) => <HistoryItem key={r.id} record={r} />)}</div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ClipboardCheck size={15} className="text-[#10B981]" /> Recent Quizzes
            </h3>
            {quizHistory.length === 0 ? (
              <p className="text-[#8E8E93] text-xs py-3">No quizzes yet.</p>
            ) : (
              <div className="space-y-2">{quizHistory.map((r) => <HistoryItem key={r.id} record={r} />)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}