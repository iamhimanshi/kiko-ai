import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi, analyticsApi } from '../services/api';
import {
  Plus, Clock, Target, Zap, Calendar, ArrowRight,
  TrendingUp, Activity, PlayCircle, Loader2, Globe, CheckCircle,
} from 'lucide-react';

function fmtDuration(seconds) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 > 0 ? `${h}h ${m % 60}m` : `${h}h`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState(null);
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, tRes, wRes, sRes] = await Promise.all([
          sessionApi.getActive().catch(() => ({ data: null })),
          analyticsApi.overview('today').catch(() => ({ data: null })),
          analyticsApi.overview('7d').catch(() => ({ data: null })),
          sessionApi.list(5).catch(() => ({ data: [] })),
        ]);
        setActive(aRes.data && aRes.data.id ? aRes.data : null);
        setToday(tRes.data);
        setWeek(wRes.data);
        setRecentSessions(sRes.data || []);
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = new Date().getHours() < 12
    ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening';

  // Pick latest session with ai_insights
  const latestInsight = recentSessions.find((s) => s.ai_insights)?.ai_insights;

  // Focus snapshot — derived from today's data
  const longestFocus = today?.longest_focus_seconds || 0;
  const distractionCount = today?.distraction_count || 0;
  const topDistracting = today?.top_distracting?.[0]?.domain || null;
  const avgFocus = today?.sessions_count > 0
    ? Math.floor((today.total_focused_seconds || 0) / today.sessions_count)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">
              Good {greeting}, {user?.full_name || user?.username} 👋
            </h1>
            <p className="text-[#4B5563] text-sm">
              {active
                ? 'You have an active session in progress.'
                : 'Ready to make your next study session count?'}
            </p>
          </div>

          {loading ? (
            <div className="bg-[#EDF4EE] text-[#6B7280] px-5 py-2.5 rounded-[14px] font-medium text-sm">
              <Loader2 size={14} className="inline animate-spin mr-1" /> Loading
            </div>
          ) : active ? (
            <Link
              to={`/study-session/active/${active.id}`}
              className="bg-[#D4A64A] hover:bg-[#C9962E] text-white px-5 py-2.5 rounded-[14px] font-medium transition flex items-center gap-2 shadow-[0px_4px_12px_rgba(212,166,74,0.3)]"
            >
              <PlayCircle size={18} />
              Resume Session
            </Link>
          ) : (
            <Link
              to="/study-session/setup"
              className="bg-[#1B4332] hover:bg-[#24543F] text-white px-5 py-2.5 rounded-[14px] font-medium transition flex items-center gap-2"
            >
              <Plus size={18} />
              Start Study Session
            </Link>
          )}
        </div>

        {/* Active session banner */}
        {active && !loading && (
          <Link
            to={`/study-session/active/${active.id}`}
            className="block bg-gradient-to-br from-[#FFF8E8] to-[#FFF3D6] border border-[#D4A64A]/40 rounded-[18px] p-5 mb-6 hover:shadow-[0px_4px_12px_rgba(212,166,74,0.15)] transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#D4A64A] rounded-xl flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="text-white" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#4D3A11] font-semibold text-sm">
                      Active Session in Progress
                    </p>
                    <span className="bg-[#D4A64A]/20 text-[#4D3A11] text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {active.status}
                    </span>
                  </div>
                  <p className="text-[#4D3A11] text-sm font-medium">{active.subject}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{active.goal}</p>
                </div>
              </div>
              <ArrowRight className="text-[#D4A64A] flex-shrink-0 mt-2" size={20} />
            </div>
          </Link>
        )}

        {/* Today's Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Clock, label: 'Study Time',
              value: fmtDuration(today?.total_study_seconds),
              sub: 'Today',
              iconBg: 'bg-[#EEF7F0]', iconColor: 'text-[#1B4332]',
            },
            {
              icon: Target, label: 'Focus Score',
              value: today?.has_data ? `${today.focus_score}%` : '—',
              sub: today?.has_data ? (today.focus_score >= 80 ? 'Excellent' : today.focus_score >= 60 ? 'Good' : 'Keep going') : 'No sessions yet',
              iconBg: 'bg-[#EAF8EC]', iconColor: 'text-[#2E7D32]',
            },
            {
              icon: Zap, label: 'Distraction',
              value: fmtDuration(today?.total_distracted_seconds),
              sub: `${distractionCount} events`,
              iconBg: 'bg-[#FFF8E8]', iconColor: 'text-[#D4A64A]',
            },
            {
              icon: Calendar, label: 'Sessions',
              value: `${today?.completed_sessions || 0}`,
              sub: today?.sessions_count > 0 ? `of ${today.sessions_count} today` : 'Completed',
              iconBg: 'bg-[#EDF4EE]', iconColor: 'text-[#1B4332]',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[#6B7280] text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">{stat.value}</p>
                    <p className="text-[#9CA3AF] text-xs mt-1">{stat.sub}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                    <Icon className={stat.iconColor} size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Focus Overview + Recent Sessions */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Recent Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1F2937]">Recent Sessions</h2>
                <Link to="/analytics" className="text-[#1B4332] text-sm font-medium hover:underline flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              {loading ? (
                <div className="text-center py-6 text-[#6B7280] text-sm">Loading...</div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🚀</div>
                  <p className="text-[#6B7280] text-sm">No sessions yet</p>
                  <Link to="/study-session/setup" className="text-[#1B4332] text-sm font-medium hover:underline mt-2 inline-block">
                    Start your first session
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/analytics/session/${s.id}`)}
                      className="w-full flex items-center justify-between p-4 bg-[#F8F7F2] rounded-[14px] hover:bg-[#EEF7F0] transition text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#1F2937] text-sm truncate">{s.subject}</p>
                        <div className="flex items-center gap-3 text-[#6B7280] text-xs mt-1">
                          <span>{Math.floor((s.actual_duration_seconds || 0) / 60)} min</span>
                          <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                          <span>{fmtDate(s.ended_at || s.created_at)}</span>
                          <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                          <span>{s.completed_tasks}/{s.total_tasks} tasks</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-[#9CA3AF] group-hover:text-[#1B4332] transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Focus Overview (weekly) */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Focus Overview</h2>
            {loading ? (
              <div className="text-center py-6 text-[#6B7280] text-sm">Loading...</div>
            ) : !week?.has_data ? (
              <p className="text-[#9CA3AF] text-sm text-center py-6">
                Complete sessions to see your weekly trend.
              </p>
            ) : (
              (() => {
                const days = week.daily_focus.slice(-7);
                const maxSec = Math.max(
                  ...days.map((d) => (d.focus_seconds || 0) + (d.distraction_seconds || 0)),
                  1
                );
                return (
                  <div className="space-y-3">
                    {days.map((d) => {
                      const total = (d.focus_seconds || 0) + (d.distraction_seconds || 0);
                      const fw = ((d.focus_seconds || 0) / maxSec) * 100;
                      const dw = ((d.distraction_seconds || 0) / maxSec) * 100;
                      const label = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-[#6B7280] text-xs w-8">{label}</span>
                          <div className="flex-1 h-5 bg-[#F8F7F2] rounded-md overflow-hidden flex">
                            <div className="bg-[#2E7D32]" style={{ width: `${fw}%` }} />
                            <div className="bg-[#D14343]" style={{ width: `${dw}%` }} />
                          </div>
                          <span className="text-[#4B5563] text-xs w-10 text-right">
                            {total ? fmtDuration(total) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Focus Snapshot + AI Insight */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Focus Snapshot */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-4">Your Focus Snapshot</h2>
            {loading ? (
              <div className="text-center py-6 text-[#6B7280] text-sm">Loading...</div>
            ) : !today?.has_data ? (
              <p className="text-[#9CA3AF] text-sm text-center py-6">
                Complete a session to see your focus snapshot.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#EAF8EC] rounded-[14px] p-4">
                  <TrendingUp size={16} className="text-[#2E7D32] mb-2" />
                  <p className="text-xl font-bold text-[#1F2937]">
                    {Math.floor(longestFocus / 60)} min
                  </p>
                  <p className="text-[#4B5563] text-xs">Longest Focus</p>
                </div>
                <div className="bg-[#FFF8E8] rounded-[14px] p-4">
                  <Zap size={16} className="text-[#D4A64A] mb-2" />
                  <p className="text-xl font-bold text-[#1F2937]">{distractionCount}</p>
                  <p className="text-[#4B5563] text-xs">Distractions</p>
                </div>
                <div className="bg-[#F8F7F2] rounded-[14px] p-4">
                  <Clock size={16} className="text-[#1B4332] mb-2" />
                  <p className="text-xl font-bold text-[#1F2937]">
                    {Math.floor(avgFocus / 60)} min
                  </p>
                  <p className="text-[#4B5563] text-xs">Avg Focus Period</p>
                </div>
                <div className="bg-[#FDECEC] rounded-[14px] p-4">
                  <Globe size={16} className="text-[#D14343] mb-2" />
                  <p className="text-sm font-bold text-[#1F2937] truncate">
                    {topDistracting || '—'}
                  </p>
                  <p className="text-[#4B5563] text-xs">Top Distraction</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Insight */}
          <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-[#D4A64A]" />
              <h2 className="text-lg font-semibold text-[#4D3A11]">Recent Insight</h2>
            </div>
            {loading ? (
              <div className="text-center py-6 text-[#6B7280] text-sm">Loading...</div>
            ) : latestInsight ? (
              <>
                <p className="text-[#4B5563] text-sm leading-relaxed whitespace-pre-wrap line-clamp-5">
                  {latestInsight.length > 280
                    ? latestInsight.slice(0, 280) + '…'
                    : latestInsight}
                </p>
                <Link
                  to={`/analytics`}
                  className="text-[#1B4332] text-sm font-medium hover:underline mt-3 inline-flex items-center gap-1"
                >
                  View full report <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <p className="text-[#4B5563] text-sm leading-relaxed">
                💡 Complete a few study sessions to receive personalized focus insights.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}