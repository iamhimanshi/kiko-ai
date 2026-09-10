import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  CheckCircle,
  Target,
  Clock,
  TrendingUp,
  LayoutDashboard,
  FileText,
  AlertTriangle,
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
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#6B7280]">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 max-w-md text-center">
            <AlertTriangle className="text-[#D14343] mx-auto mb-3" size={40} />
            <p className="text-[#1F2937] font-medium mb-4">
              {error || 'Session not found'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-2.5 rounded-[14px] font-medium transition"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const actualMinutes = session.actual_duration_seconds
    ? Math.floor(session.actual_duration_seconds / 60)
    : 0;
  const taskProgress =
    session.total_tasks > 0
      ? Math.round((session.completed_tasks / session.total_tasks) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Celebration */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 overflow-hidden mb-6">
            <div className="bg-gradient-to-br from-[#EEF7F0] to-[#F8F7F2] p-8 text-center border-b border-[#E8ECE7]/50">
              <div className="text-5xl mb-3">🎉</div>
              <h1 className="text-2xl font-bold text-[#1F2937]">
                Session Complete
              </h1>
              <p className="text-[#4B5563] text-sm mt-1">{session.subject}</p>
            </div>

            <div className="p-8">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#F8F7F2] rounded-[14px] p-4 text-center">
                  <Clock size={18} className="text-[#1B4332] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#1F2937]">
                    {actualMinutes}
                  </p>
                  <p className="text-[#6B7280] text-xs">minutes</p>
                </div>
                <div className="bg-[#F8F7F2] rounded-[14px] p-4 text-center">
                  <CheckCircle
                    size={18}
                    className="text-[#2E7D32] mx-auto mb-2"
                  />
                  <p className="text-2xl font-bold text-[#1F2937]">
                    {session.completed_tasks}/{session.total_tasks}
                  </p>
                  <p className="text-[#6B7280] text-xs">tasks done</p>
                </div>
                <div className="bg-[#F8F7F2] rounded-[14px] p-4 text-center">
                  <TrendingUp
                    size={18}
                    className="text-[#D4A64A] mx-auto mb-2"
                  />
                  <p className="text-2xl font-bold text-[#1F2937]">
                    {taskProgress}%
                  </p>
                  <p className="text-[#6B7280] text-xs">progress</p>
                </div>
              </div>

              {/* Goal */}
              <div className="bg-[#F8F7F2] rounded-[14px] p-4 mb-6">
                <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-1">
                  Goal
                </p>
                <p className="text-[#1F2937] text-sm">{session.goal}</p>
              </div>

              {/* AI insight placeholder */}
              <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[14px] p-4 mb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[#D4A64A] text-sm">✨</span>
                  <p className="text-[#4D3A11] font-medium text-sm">
                    Session saved
                  </p>
                </div>
                <p className="text-[#4B5563] text-xs leading-relaxed">
                  AI-powered insights will be available once Analytics is
                  enabled.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 bg-white border border-[#E8ECE7] hover:bg-[#EDF4EE] text-[#4B5563] py-3 rounded-[14px] font-medium transition flex items-center justify-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </button>
                <button
                  onClick={() =>
                    navigate(`/analytics/session/${session.id}`)
                  }
                  className="flex-1 bg-[#1B4332] hover:bg-[#24543F] text-white py-3 rounded-[14px] font-medium transition flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  View Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}