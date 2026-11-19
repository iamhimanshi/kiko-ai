import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  CheckCircle, Clock, TrendingUp, LayoutDashboard,
  FileText, AlertTriangle, Coffee, Zap, Award, Sparkles,
} from 'lucide-react';

export default function SessionComplete() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await sessionApi.getById(sessionId);
        setSession(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Session not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#8E8E93] font-medium">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="card p-8 max-w-md text-center">
            <AlertTriangle className="text-[#FF841C] mx-auto mb-3" size={40} />
            <p className="text-white font-semibold mb-4">{error || 'Session not found'}</p>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const actualMinutes = session.actual_duration_seconds ? Math.floor(session.actual_duration_seconds / 60) : 0;
  const pausedMinutes = session.paused_duration_seconds ? Math.floor(session.paused_duration_seconds / 60) : 0;
  const taskProgress = session.total_tasks > 0 ? Math.round((session.completed_tasks / session.total_tasks) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="card overflow-hidden mb-6">
            <div className="bg-[#232325] p-8 text-center border-b border-[#2E2E32]">
              <div className="w-12 h-12 bg-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Award size={26} className="text-[#121212]" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Session Complete</h1>
              <p className="text-[#8E8E93] text-sm mt-1">{session.subject}</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0F2922] border border-[#10B981]/30 rounded-[14px] p-4 text-center">
                  <Clock size={18} className="text-[#10B981] mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{actualMinutes}</p>
                  <p className="text-[#8E8E93] text-xs font-semibold">Minutes Studied</p>
                </div>
                <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 text-center">
                  <Clock size={18} className="text-[#FF841C] mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{session.duration_minutes}</p>
                  <p className="text-[#8E8E93] text-xs font-semibold">Minutes Planned</p>
                </div>
                <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 text-center">
                  <CheckCircle size={18} className="text-[#10B981] mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{session.completed_tasks}/{session.total_tasks}</p>
                  <p className="text-[#8E8E93] text-xs font-semibold">Tasks Done</p>
                </div>
                <div className="bg-[#261A10] border border-[#FF841C]/30 rounded-[14px] p-4 text-center">
                  <TrendingUp size={18} className="text-[#FF841C] mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{taskProgress}%</p>
                  <p className="text-[#8E8E93] text-xs font-semibold">Task Progress</p>
                </div>
              </div>

              <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 mb-6">
                <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-3">Time Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Actual studied</span>
                    <span className="text-white font-semibold">{actualMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">Planned</span>
                    <span className="text-white font-semibold">{session.duration_minutes} min</span>
                  </div>
                  {pausedMinutes > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#8E8E93]">Paused</span>
                      <span className="text-white font-semibold">{pausedMinutes} min</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#2E2E32]">
                    <span className="text-[#8E8E93]">Mode</span>
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      {session.mode === 'pomodoro' ? (
                        <><Coffee size={14} className="text-[#FF841C]" /> Pomodoro</>
                      ) : (
                        <><Zap size={14} className="text-[#10B981]" /> Continuous</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 mb-6">
                <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-1">Goal</p>
                <p className="text-white text-sm font-medium">{session.goal}</p>
              </div>

              <div className="bg-[#261A10] border border-[#FF841C]/35 rounded-[14px] p-4 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={15} className="text-[#FF841C]" />
                  <p className="text-white font-bold text-sm">Session saved</p>
                </div>
                <p className="text-[#D1D5DB] text-xs leading-relaxed">
                  Your focus timeline and AI insights are ready in your Analytics report.
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2">
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                <button type="button" onClick={() => navigate('/study-session')} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                  <FileText size={18} />
                  All Sessions
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

