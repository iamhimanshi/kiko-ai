import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  ArrowLeft,
  Target,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

export default function SessionPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = location.state;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user lands here directly without data, go back to setup
  if (!sessionData) {
    return <Navigate to="/study-session/setup" replace />;
  }

  const { subject, goal, duration_minutes, tasks } = sessionData;

  const handleStart = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await sessionApi.create({
        subject,
        goal,
        duration_minutes,
        tasks,
      });

      // Navigate to active session with session ID
      navigate(`/study-session/active/${response.data.id}`, {
        replace: true,
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail || 'Could not start session. Try again.';
      setError(detail);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-lg">
          <button
            onClick={() => navigate('/study-session/setup')}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Setup
          </button>

          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#EEF7F0] to-[#F8F7F2] p-8 text-center border-b border-[#E8ECE7]/50">
              <div className="text-5xl mb-3">🎯</div>
              <h1 className="text-2xl font-bold text-[#1F2937]">Ready to Focus?</h1>
              <p className="text-[#4B5563] text-sm mt-1">
                Review your session before starting.
              </p>
            </div>

            {/* Body */}
            <div className="p-8">
              {error && (
                <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-5 text-sm">
                  {error}
                </div>
              )}

              {/* Subject */}
              <div className="mb-5">
                <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-1">
                  Subject
                </p>
                <p className="text-[#1F2937] font-semibold text-lg">{subject}</p>
              </div>

              {/* Goal */}
              <div className="mb-5">
                <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-1">
                  Goal
                </p>
                <p className="text-[#1F2937]">{goal}</p>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-1">
                  Duration
                </p>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#1B4332]" />
                  <p className="text-[#1F2937] font-medium">
                    {duration_minutes} minutes
                  </p>
                </div>
              </div>

              {/* Tasks */}
              {tasks && tasks.length > 0 && (
                <div className="mb-6">
                  <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-2">
                    Tasks ({tasks.length})
                  </p>
                  <div className="bg-[#F8F7F2] rounded-[14px] p-4 space-y-2">
                    {tasks.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[#4B5563] text-sm"
                      >
                        <Circle size={14} className="text-[#9CA3AF] flex-shrink-0" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-[#1B4332] hover:bg-[#24543F] text-white font-semibold py-3.5 rounded-[14px] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  'Starting session...'
                ) : (
                  <>
                    <PlayCircle size={20} />
                    Start Session
                  </>
                )}
              </button>

              <p className="text-center text-[#9CA3AF] text-xs mt-3 flex items-center justify-center gap-1">
                <Sparkles size={12} />
                MindGuard will activate automatically
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}