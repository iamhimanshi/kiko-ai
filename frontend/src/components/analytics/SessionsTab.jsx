import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionApi } from '../../services/api';
import { Loader2, Clock, CheckCircle, FileText, Calendar, BookOpen } from 'lucide-react';

export default function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sessionApi.list(50);
        setSessions((res.data || []).filter((s) => s.status === 'COMPLETED' || s.status === 'ABANDONED'));
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = sessions.filter((s) =>
    s.subject.toLowerCase().includes(search.toLowerCase()) ||
    s.goal.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#8E8E93] gap-2">
        <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading sessions...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by subject or goal..."
        className="input-field text-sm"
      />

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="text-[#8E8E93]" size={22} />
          </div>
          <p className="text-white font-semibold">No sessions found</p>
          <p className="text-[#8E8E93] text-sm mt-1">
            {search ? 'Try a different search.' : 'Complete a study session to see it here.'}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-[#2E2E32]">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/analytics/session/${s.id}`}
              className="flex items-center justify-between gap-4 p-5 hover:bg-[#232325] transition group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold">{s.subject}</p>
                <p className="text-[#8E8E93] text-xs mt-0.5 truncate">{s.goal}</p>
                <div className="flex items-center gap-3 text-[#8E8E93] text-xs mt-2">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(s.ended_at || s.created_at)}</span>
                  <span className="w-1 h-1 bg-[#2E2E32] rounded-full" />
                  <span className="flex items-center gap-1"><Clock size={11} /> {Math.floor((s.actual_duration_seconds || 0) / 60)} min</span>
                  <span className="w-1 h-1 bg-[#2E2E32] rounded-full" />
                  <span className="flex items-center gap-1"><CheckCircle size={11} className="text-[#10B981]" /> {s.completed_tasks}/{s.total_tasks} tasks</span>
                </div>
              </div>
              <FileText size={16} className="text-[#8E8E93] group-hover:text-[#FF841C] transition flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}