import { useState, useEffect } from 'react';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';
import { assistantApi } from '../../services/api';
import { ArrowRight, Clock, Trash2, Loader2 } from 'lucide-react';

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

  if (view === 'flashcards') {
    return <FlashcardsView onBack={closeView} initialRecord={resumeRecord} />;
  }
  if (view === 'quiz') {
    return <QuizView onBack={closeView} initialRecord={resumeRecord} />;
  }

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
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
    <div className="flex items-center justify-between gap-3 p-3 bg-[#F8F7F2] rounded-[12px] hover:bg-[#EEF7F0] transition group">
      <button
        onClick={() => openRecord(record)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-[#1F2937] text-sm font-medium truncate">
          {record.document_name || 'Untitled material'}
        </p>
        <div className="flex items-center gap-2 text-[#6B7280] text-xs mt-0.5">
          <span>{record.count} {record.type === 'quiz' ? 'Q' : 'cards'}</span>
          <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDate(record.created_at)}
          </span>
        </div>
      </button>
      <button
        onClick={() => deleteRecord(record.id)}
        className="text-[#9CA3AF] hover:text-[#D14343] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold text-[#1F2937]">Practice</h2>
        <p className="text-[#6B7280] text-sm mt-1">
          What would you like to practice today?
        </p>
      </div>

      {/* Practice type cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => { setResumeRecord(null); setView('flashcards'); }}
          className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-left hover:shadow-[0px_8px_24px_rgba(16,24,40,0.10)] hover:border-[#1B4332]/30 transition group"
        >
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Flashcards</h3>
          <p className="text-[#6B7280] text-sm mb-5">Test your memory with active recall.</p>
          <span className="inline-flex items-center gap-1.5 text-[#1B4332] text-sm font-medium group-hover:gap-2.5 transition-all">
            Create new <ArrowRight size={14} />
          </span>
        </button>

        <button
          onClick={() => { setResumeRecord(null); setView('quiz'); }}
          className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-left hover:shadow-[0px_8px_24px_rgba(16,24,40,0.10)] hover:border-[#1B4332]/30 transition group"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Quiz</h3>
          <p className="text-[#6B7280] text-sm mb-5">Test your understanding with MCQs.</p>
          <span className="inline-flex items-center gap-1.5 text-[#1B4332] text-sm font-medium group-hover:gap-2.5 transition-all">
            Create new <ArrowRight size={14} />
          </span>
        </button>
      </div>

      {/* History */}
      {historyLoading ? (
        <div className="flex items-center justify-center py-8 text-[#9CA3AF] text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading history...
        </div>
      ) : (fcHistory.length > 0 || quizHistory.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
              <span>🧠</span> Recent Flashcard Decks
            </h3>
            {fcHistory.length === 0 ? (
              <p className="text-[#9CA3AF] text-xs py-3">No flashcard decks yet.</p>
            ) : (
              <div className="space-y-2">
                {fcHistory.map((r) => <HistoryItem key={r.id} record={r} />)}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-5">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
              <span>📝</span> Recent Quizzes
            </h3>
            {quizHistory.length === 0 ? (
              <p className="text-[#9CA3AF] text-xs py-3">No quizzes yet.</p>
            ) : (
              <div className="space-y-2">
                {quizHistory.map((r) => <HistoryItem key={r.id} record={r} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}