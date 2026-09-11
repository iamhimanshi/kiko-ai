import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  Plus, PlayCircle, Clock, CheckCircle, Loader2,
  Calendar, TrendingUp, FileText, ArrowRight,
} from 'lucide-react';

export default function StudySessionHub() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activeRes, listRes] = await Promise.all([
          sessionApi.getActive(),
          sessionApi.list(10),
        ]);
        setActive(activeRes.data && activeRes.data.id ? activeRes.data : null);
        setHistory(listRes.data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const fmtDuration = (s) => {
    if (!s) return '0m';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const completed = history.filter((s) => s.status === 'COMPLETED');

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-[#1F2937]">Study Session</h1>
              <p className="text-[#6B7280] text-sm mt-1">Plan, focus, and review your study time.</p>
            </div>
            {!active && (
              <Link
                to="/study-session/setup"
                className="bg-[#1B4332] hover:bg-[#24543F] text-white px-5 py-2.5 rounded-[14px] font-medium transition flex items-center gap-2"
              >
                <Plus size={18} />
                New Session
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading...
            </div>
          ) : (
            <>
              {/* Active session */}
              {active && (
                <Link
                  to={`/study-session/active/${active.id}`}
                  className="block bg-gradient-to-br from-[#FFF8E8] to-[#FFF3D6] border border-[#D4A64A]/40 rounded-[18px] p-6 mb-8 hover:shadow-[0px_4px_12px_rgba(212,166,74,0.15)] transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#D4A64A] rounded-xl flex items-center justify-center flex-shrink-0">
                        <PlayCircle className="text-white" size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[#4D3A11] font-semibold">Session in Progress</p>
                          <span className="bg-[#D4A64A]/20 text-[#4D3A11] text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {active.status}
                          </span>
                        </div>
                        <p className="text-[#4D3A11] font-medium">{active.subject}</p>
                        <p className="text-[#6B7280] text-sm mt-0.5">{active.goal}</p>
                        <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {active.duration_minutes} min planned
                          </span>
                          <span className="w-1 h-1 bg-[#D4A64A]/40 rounded-full" />
                          <span>{active.completed_tasks}/{active.total_tasks} tasks done</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#4D3A11] font-medium">
                      Resume <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              )}

              {/* Empty state */}
              {!active && completed.length === 0 && (
                <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-12 text-center">
                  <div className="text-5xl mb-3">🎯</div>
                  <h3 className="text-xl font-semibold text-[#1F2937] mb-2">No sessions yet</h3>
                  <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-6">
                    Start your first focused study session to begin building your productivity history.
                  </p>
                  <Link
                    to="/study-session/setup"
                    className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-3 rounded-[14px] font-medium transition inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Start a Session
                  </Link>
                </div>
              )}

              {/* History */}
              {completed.length > 0 && (
                <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
                      <Calendar size={18} className="text-[#1B4332]" />
                      Session History
                    </h2>
                    <span className="text-[#6B7280] text-xs">{completed.length} sessions</span>
                  </div>
                  <div className="space-y-2">
                    {completed.map((s) => {
                      const actualMin = s.actual_duration_seconds
                        ? Math.floor(s.actual_duration_seconds / 60) : 0;
                      const taskPct = s.total_tasks > 0
                        ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 0;
                      return (
                        <Link
                          key={s.id}
                          to={`/study-session/complete/${s.id}`}
                          className="flex items-center justify-between gap-4 p-4 bg-[#F8F7F2] rounded-[14px] hover:bg-[#EEF7F0] transition group"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[#1F2937] font-medium text-sm truncate">
                              {s.subject}
                            </p>
                            <p className="text-[#6B7280] text-xs truncate mt-0.5">
                              {s.goal}
                            </p>
                            <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-1">
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {actualMin} min studied
                              </span>
                              <span className="w-1 h-1 bg-[#E8ECE7] rounded-full" />
                              <span className="flex items-center gap-1">
                                <CheckCircle size={11} />
                                {s.completed_tasks}/{s.total_tasks} tasks
                              </span>
                              <span className="w-1 h-1 bg-[#E8ECE7] rounded-full" />
                              <span>{fmtDate(s.ended_at || s.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[#1B4332] font-semibold text-sm">{taskPct}%</p>
                              <p className="text-[#9CA3AF] text-[10px]">progress</p>
                            </div>
                            <FileText
                              size={16}
                              className="text-[#9CA3AF] group-hover:text-[#1B4332] transition"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}