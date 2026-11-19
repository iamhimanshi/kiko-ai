import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  Plus, PlayCircle, Clock, CheckCircle, Loader2,
  Calendar, FileText, ArrowRight, XCircle, Target,
} from 'lucide-react';

const STATUS_BADGE = {
  COMPLETED: { label: 'Completed', bg: '#0F2922', color: '#10B981', icon: CheckCircle },
  ABANDONED: { label: 'Abandoned', bg: '#232325', color: '#8E8E93', icon: XCircle },
};

export default function StudySessionHub() {
  const [active, setActive] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [activeRes, listRes] = await Promise.all([
          sessionApi.getActive(),
          sessionApi.list(50),
        ]);
        const act = activeRes.data && activeRes.data.id ? activeRes.data : null;
        setActive(act);
        const list = listRes.data || [];
        setAllSessions(list.filter((s) => s.status !== 'ACTIVE' && s.status !== 'PAUSED'));
      } catch (err) {
        console.error('Session hub load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Study Session</h1>
            <p className="text-[#8E8E93] text-sm mt-1">Plan, focus, and review your study time.</p>
          </div>
          {!active && !loading && (
            <Link to="/study-session/setup" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus size={18} />
              New Session
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#8E8E93] gap-2">
            <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading...
          </div>
        ) : (
          <div className="space-y-6">
            {active && (
              <Link
                to={`/study-session/active/${active.id}`}
                className="block card p-6 hover:border-[#FF841C]/60"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#E66A10] rounded-xl flex items-center justify-center flex-shrink-0">
                      <PlayCircle className="text-white" size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">Active Session in Progress</p>
                        <span className="bg-[#261A10] border border-[#FF841C]/40 text-[#FF841C] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {active.status}
                        </span>
                      </div>
                      <p className="text-white font-medium">{active.subject}</p>
                      <p className="text-[#8E8E93] text-sm mt-0.5">{active.goal}</p>
                      <div className="flex items-center gap-3 text-[#8E8E93] text-xs mt-2">
                        <span className="flex items-center gap-1"><Clock size={12} /> {active.duration_minutes} min planned</span>
                        <span className="w-1 h-1 bg-[#2E2E32] rounded-full" />
                        <span>{active.completed_tasks}/{active.total_tasks} tasks done</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#FF841C] font-semibold">
                    Resume <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            )}

            {!active && (
              <div className="card p-10 text-center">
                <div className="w-14 h-14 bg-[#261A10] border border-[#FF841C]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="text-[#FF841C]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {allSessions.length === 0 ? 'No sessions yet' : 'Ready for another session?'}
                </h3>
                <p className="text-[#8E8E93] text-sm max-w-md mx-auto mb-6">
                  {allSessions.length === 0
                    ? 'Start your first focused study session to begin building your productivity history.'
                    : 'Set a goal, break it into tasks, and stay locked in.'}
                </p>
                <Link to="/study-session/setup" className="btn-primary inline-flex items-center gap-2">
                  <Plus size={18} />
                  Start a Session
                </Link>
              </div>
            )}

            {allSessions.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-[#FF841C]" />
                    Session History
                  </h2>
                  <span className="text-[#8E8E93] text-xs font-medium">
                    {allSessions.length} {allSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {allSessions.map((s) => {
                    const actualMin = s.actual_duration_seconds ? Math.floor(s.actual_duration_seconds / 60) : 0;
                    const badge = STATUS_BADGE[s.status] || STATUS_BADGE.COMPLETED;
                    const BadgeIcon = badge.icon;
                    return (
                      <Link
                        key={s.id}
                        to={`/study-session/complete/${s.id}`}
                        className="flex items-center justify-between gap-4 p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px] hover:border-[#FF841C]/50 transition group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-semibold text-sm truncate">{s.subject}</p>
                            <span
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              <BadgeIcon size={10} />
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[#8E8E93] text-xs truncate">{s.goal}</p>
                          <div className="flex items-center gap-3 text-[#8E8E93] text-xs mt-1">
                            <span className="flex items-center gap-1"><Clock size={11} /> {actualMin} min</span>
                            <span className="w-1 h-1 bg-[#2E2E32] rounded-full" />
                            <span className="flex items-center gap-1"><CheckCircle size={11} /> {s.completed_tasks}/{s.total_tasks} tasks</span>
                            <span className="w-1 h-1 bg-[#2E2E32] rounded-full" />
                            <span>{fmtDate(s.ended_at || s.created_at)}</span>
                          </div>
                        </div>
                        <FileText size={16} className="text-[#8E8E93] group-hover:text-[#FF841C] transition flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
