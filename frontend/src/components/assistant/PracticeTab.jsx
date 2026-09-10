import { useState } from 'react';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';
import { ArrowRight } from 'lucide-react';

export default function PracticeTab() {
  const [view, setView] = useState('hub'); // 'hub' | 'flashcards' | 'quiz'

  if (view === 'flashcards') {
    return <FlashcardsView onBack={() => setView('hub')} />;
  }
  if (view === 'quiz') {
    return <QuizView onBack={() => setView('hub')} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h2 className="text-xl font-bold text-[#1F2937]">Practice</h2>
        <p className="text-[#6B7280] text-sm mt-1">
          What would you like to practice today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => setView('flashcards')}
          className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-left hover:shadow-[0px_8px_24px_rgba(16,24,40,0.10)] hover:border-[#1B4332]/30 transition group"
        >
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Flashcards</h3>
          <p className="text-[#6B7280] text-sm mb-5">Test your memory with active recall.</p>
          <span className="inline-flex items-center gap-1.5 text-[#1B4332] text-sm font-medium group-hover:gap-2.5 transition-all">
            Start <ArrowRight size={14} />
          </span>
        </button>

        <button
          onClick={() => setView('quiz')}
          className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-left hover:shadow-[0px_8px_24px_rgba(16,24,40,0.10)] hover:border-[#1B4332]/30 transition group"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-1">Quiz</h3>
          <p className="text-[#6B7280] text-sm mb-5">Test your understanding with MCQs.</p>
          <span className="inline-flex items-center gap-1.5 text-[#1B4332] text-sm font-medium group-hover:gap-2.5 transition-all">
            Start <ArrowRight size={14} />
          </span>
        </button>
      </div>
    </div>
  );
}