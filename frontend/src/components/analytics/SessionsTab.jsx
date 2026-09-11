import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionApi } from '../../services/api';
import { Loader2, Clock, CheckCircle, FileText, Calendar } from 'lucide-react';

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
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading sessions...
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
        className="w-full bg-white border border-[#E8ECE7] rounded-[14px] px-4 py-3 text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] transition-all text-sm"
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-12 text-center">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-[#1F2937] font-medium">No sessions found</p>
          <p className="text-[#6B7280] text-sm mt-1">
            {search ? 'Try a different search.' : 'Complete a study session to see it here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 divide-y divide-[#E8ECE7]/50">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/analytics/session/${s.id}`}
              className="flex items-center justify-between gap-4 p-5 hover:bg-[#F8F7F2] transition group"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[#1F2937] font-medium">{s.subject}</p>
                <p className="text-[#9CA3AF] text-xs mt-0.5 truncate">{s.goal}</p>
                <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {fmtDate(s.ended_at || s.created_at)}
                  </span>
                  <span className="w-1 h-1 bg-[#E8ECE7] rounded-full" />
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {Math.floor((s.actual_duration_seconds || 0) / 60)} min
                  </span>
                  <span className="w-1 h-1 bg-[#E8ECE7] rounded-full" />
                  <span className="flex items-center gap-1">
                    <CheckCircle size={11} />
                    {s.completed_tasks}/{s.total_tasks} tasks
                  </span>
                </div>
              </div>
              <FileText
                size={16}
                className="text-[#9CA3AF] group-hover:text-[#1B4332] transition flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}