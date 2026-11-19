import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import { ArrowLeft, Clock, Circle, PlayCircle, Sparkles, Zap, Coffee, Target } from 'lucide-react';

export default function SessionPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = location.state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!sessionData) return <Navigate to="/study-session/setup" replace />;

  const { subject, goal, duration_minutes, tasks, mode, work_duration_minutes, break_duration_minutes } = sessionData;

  const handleStart = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await sessionApi.create(sessionData);
      navigate(`/study-session/active/${response.data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start session. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-lg">
          <button
            type="button"
            onClick={() => navigate('/study-session/setup')}
            className="flex items-center gap-2 text-[#8E8E93] hover:text-white font-medium transition mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            Back to Setup
          </button>

          <div className="card overflow-hidden">
            <div className="bg-[#232325] p-8 text-center border-b border-[#2E2E32]">
              <div className="w-12 h-12 bg-[#E66A10] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-amber">
                <Target size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Ready to Focus?</h1>
              <p className="text-[#8E8E93] text-sm mt-1">Review your session before diving in.</p>
            </div>

            <div className="p-8">
              {error && (
                <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-5 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="mb-5">
                <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Subject</p>
                <p className="text-white font-bold text-lg">{subject}</p>
              </div>

              <div className="mb-5">
                <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Goal</p>
                <p className="text-[#D1D5DB] text-sm">{goal}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-3.5">
                  <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Duration</p>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#FF841C]" />
                    <p className="text-white font-bold">{duration_minutes} min</p>
                  </div>
                </div>
                <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-3.5">
                  <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Mode</p>
                  <div className="flex items-center gap-2">
                    {mode === 'pomodoro' ? (
                      <><Coffee size={16} className="text-[#FF841C]" /><p className="text-white font-bold">Pomodoro</p></>
                    ) : (
                      <><Zap size={16} className="text-[#10B981]" /><p className="text-white font-bold">Continuous</p></>
                    )}
                  </div>
                </div>
              </div>

              {mode === 'pomodoro' && (
                <div className="bg-[#261A10] border border-[#FF841C]/30 rounded-[14px] p-3 mb-5">
                  <p className="text-white text-xs font-medium">
                    Focus <span className="font-bold text-[#FF841C]">{work_duration_minutes} min</span>
                    {' · '}
                    Break <span className="font-bold text-[#10B981]">{break_duration_minutes} min</span>
                  </p>
                </div>
              )}

              {tasks && tasks.length > 0 && (
                <div className="mb-6">
                  <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-2">Tasks ({tasks.length})</p>
                  <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 space-y-2">
                    {tasks.map((task, i) => (
                      <div key={i} className="flex items-center gap-2 text-white text-sm font-medium">
                        <Circle size={14} className="text-[#FF841C] flex-shrink-0" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={handleStart} disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Starting session...' : <><PlayCircle size={20} /> Start Session</>}
              </button>

              <p className="text-center text-[#8E8E93] text-xs mt-3 flex items-center justify-center gap-1.5">
                <Sparkles size={12} className="text-[#FF841C]" />
                MindGuard will activate automatically
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}