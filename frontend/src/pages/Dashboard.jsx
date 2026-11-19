import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi, analyticsApi } from '../services/api';
import {
  Plus, Clock, Target, Zap, ArrowRight,
  TrendingUp, Sparkles, PlayCircle, Loader2, Globe, Flame,
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

function AnimatedScoreRing({ score = 0, hasData = false }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score || 0));
  const offset = hasData ? circumference - (clamped / 100) * circumference : circumference;
  const strokeColor = !hasData
    ? '#2E2E32'
    : clamped >= 80
    ? '#10B981'
    : clamped >= 60
    ? '#FF841C'
    : '#E66A10';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="#232325" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-extrabold text-white">
        {hasData ? `${clamped}%` : '—'}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [active, setActive] = useState(null);
  const [today, setToday] = useState(null);
  const [history90d, setHistory90d] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [heatmapRange, setHeatmapRange] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, tRes, hRes, sRes] = await Promise.all([
          sessionApi.getActive().catch(() => ({ data: null })),
          analyticsApi.overview('today').catch(() => ({ data: null })),
          analyticsApi.overview('90d').catch(() => ({ data: null })),
          sessionApi.list(5).catch(() => ({ data: [] })),
        ]);
        setActive(aRes.data && aRes.data.id ? aRes.data : null);
        setToday(tRes.data);
        setHistory90d(hRes.data);
        setRecentSessions(sRes.data || []);
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';

  const latestInsight = recentSessions.find((s) => s.ai_insights)?.ai_insights;
  const longestFocus = today?.longest_focus_seconds || 0;
  const distractionCount = today?.distraction_count || 0;
  const topDistracting = today?.top_distracting?.[0]?.domain || null;
  const avgFocus =
    today?.sessions_count > 0
      ? Math.floor((today.total_focused_seconds || 0) / today.sessions_count)
      : 0;

  const { heatmapWeeks, activeDaysCount, currentStreak } = useMemo(() => {
    const dailyMap = {};
    (history90d?.daily_focus || []).forEach((d) => {
      dailyMap[d.date] = (d.focus_seconds || 0) + (d.distraction_seconds || 0) > 0
        ? (d.focus_seconds || 0)
        : 0;
    });

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let streak = 0;
    for (let offset = 0; offset < 90; offset++) {
      const check = new Date(todayDate);
      check.setDate(todayDate.getDate() - offset);
      const key = check.toISOString().slice(0, 10);
      if ((dailyMap[key] || 0) > 0) {
        streak += 1;
      } else if (offset === 0) {
        continue;
      } else {
        break;
      }
    }

    const days = [];
    let activeCount = 0;
    for (let i = heatmapRange - 1; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const focusSec = dailyMap[key] || 0;
      if (focusSec > 0) activeCount += 1;
      days.push({
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: d.getDay(),
        minutes: Math.round(focusSec / 60),
      });
    }

    const firstWeekdayMon = (days[0].weekday + 6) % 7;
    const padded = [
      ...Array.from({ length: firstWeekdayMon }, () => null),
      ...days,
    ];
    const weeks = [];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7));
    }

    return { heatmapWeeks: weeks, activeDaysCount: activeCount, currentStreak: streak };
  }, [history90d, heatmapRange]);

  const weeklyDays = (history90d?.daily_focus || []).slice(-7);
  const maxWeeklySec = Math.max(
    ...weeklyDays.map((d) => (d.focus_seconds || 0) + (d.distraction_seconds || 0)),
    1
  );

  const studyMinutesToday = Math.floor((today?.total_study_seconds || 0) / 60);
  const dailyTargetMinutes = 120;
  const filledSegments = Math.min(16, Math.round((studyMinutesToday / dailyTargetMinutes) * 16));

  const getDotStyle = (minutes) => {
    if (minutes <= 0) return 'bg-[#2A2A2D] border border-[#2E2E32]';
    if (minutes < 20) return 'bg-[#5A3E24] border border-[#6E4B2B]';
    if (minutes < 45) return 'bg-[#99541C] border border-[#B06120]';
    if (minutes < 90) return 'bg-[#E66A10] border border-[#E66A10]';
    return 'bg-[#FF841C] border border-[#FBBF24]';
  };

  const dynamicSubtitle = active
    ? `Active session in ${active.subject} — jump back in whenever you're ready.`
    : today?.has_data
    ? `You've logged ${fmtDuration(today.total_study_seconds)} today with a ${today.focus_score}% focus score.`
    : 'Ready to dive deeply into today’s study goals?';

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Dynamic Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Good {greeting}, {user?.full_name || user?.username}
            </h1>
            <p className="text-[#8E8E93] text-sm mt-1">{dynamicSubtitle}</p>
          </div>

          {loading ? (
            <div className="bg-[#1A1A1A] border border-[#2E2E32] text-[#8E8E93] px-5 py-2.5 rounded-[14px] font-medium text-sm">
              <Loader2 size={14} className="inline animate-spin mr-1.5" /> Loading
            </div>
          ) : active ? (
            <Link
              to={`/study-session/active/${active.id}`}
              className="btn-primary flex items-center gap-2"
            >
              <PlayCircle size={18} />
              Resume Session
            </Link>
          ) : (
            <Link
              to="/study-session/setup"
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Start Study Session
            </Link>
          )}
        </div>

        {/* Active Session Banner */}
        {active && !loading && (
          <Link
            to={`/study-session/active/${active.id}`}
            className="block bg-[#1A1A1A] text-white border border-[#2E2E32] hover:border-[#FF841C]/50 rounded-[18px] p-5 mb-6 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-[#E66A10] rounded-xl flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="text-white" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">Active Session in Progress</p>
                    <span className="bg-[#261A10] border border-[#FF841C]/40 text-[#FF841C] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {active.status}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">{active.subject}</p>
                  <p className="text-[#8E8E93] text-xs mt-0.5">{active.goal}</p>
                </div>
              </div>
              <ArrowRight className="text-[#FF841C] flex-shrink-0 mt-2" size={20} />
            </div>
          </Link>
        )}

        {/* Row 1: 4 Bento KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* Study Time */}
          <div className="card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm font-medium">Study Time</span>
              <div className="w-9 h-9 rounded-xl bg-[#261A10] border border-[#FF841C]/30 flex items-center justify-center">
                <Clock size={18} className="text-[#FF841C]" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-extrabold text-white">
                {fmtDuration(today?.total_study_seconds)}
              </p>
              <div className="flex items-center gap-1 mt-3">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-3.5 flex-1 rounded-sm transition-colors ${
                      idx < filledSegments ? 'bg-[#FF841C]' : 'bg-[#2E241C]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[#8E8E93] text-xs mt-2">
                {studyMinutesToday}m of {dailyTargetMinutes}m daily goal
              </p>
            </div>
          </div>

          {/* Focus Score */}
          <div className="card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm font-medium">Focus Score</span>
              <div className="w-9 h-9 rounded-xl bg-[#0F2922] border border-[#10B981]/30 flex items-center justify-center">
                <Target size={18} className="text-[#10B981]" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-extrabold text-white">
                  {today?.has_data
                    ? today.focus_score >= 80
                      ? 'Locked In'
                      : today.focus_score >= 60
                      ? 'Steady'
                      : 'Warming Up'
                    : 'Warming Up'}
                </p>
                <p className="text-[#8E8E93] text-xs mt-1">Today’s focus quality</p>
              </div>
              <AnimatedScoreRing
                score={today?.focus_score || 0}
                hasData={Boolean(today?.has_data)}
              />
            </div>
          </div>

          {/* Distractions */}
          <div className="card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm font-medium">Distractions</span>
              <div className="w-9 h-9 rounded-xl bg-[#261A10] border border-[#FF841C]/30 flex items-center justify-center">
                <Zap size={18} className="text-[#FF841C]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white">
                  {fmtDuration(today?.total_distracted_seconds)}
                </p>
                <span className="text-xs font-semibold text-[#8E8E93]">
                  ({distractionCount} events)
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#232325] border border-[#E66A10]/40 text-white px-2.5 py-1 rounded-full truncate max-w-full">
                  <Globe size={12} className="text-[#FF841C] flex-shrink-0" />
                  {topDistracting || 'No distractions logged'}
                </span>
              </div>
            </div>
          </div>

          {/* Streak & Sessions */}
          <div className="card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93] text-sm font-medium">Consistency</span>
              <div className="w-9 h-9 rounded-xl bg-[#2D1616] border border-[#EF4444]/30 flex items-center justify-center">
                <Flame size={18} className="text-[#FF841C]" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white">{currentStreak}d</p>
                <span className="text-xs font-semibold text-[#10B981]">streak</span>
              </div>
              <p className="text-[#8E8E93] text-xs mt-3">
                {today?.completed_sessions || 0} completed{' '}
                {today?.sessions_count > 0 ? `of ${today.sessions_count} today` : 'sessions today'}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Hero Bento (2/3 FocusDot Heatmap + 1/3 AI Insight Card) */}
        <div className="grid lg:grid-cols-12 gap-6 mb-6">
          {/* Focus Consistency Dot Heatmap */}
          <div className="lg:col-span-8 card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Focus Consistency</h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  {activeDaysCount} active study {activeDaysCount === 1 ? 'day' : 'days'} in the last {heatmapRange} days
                </p>
              </div>
              <div className="inline-flex bg-[#232325] border border-[#2E2E32] rounded-[12px] p-1">
                {[30, 90].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setHeatmapRange(r)}
                    className={`px-3 py-1 rounded-[9px] text-xs font-semibold transition ${
                      heatmapRange === r
                        ? 'bg-[#E66A10] text-white'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    {r}D
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-[#8E8E93]">Loading consistency grid...</div>
            ) : (
              <div className="overflow-x-auto pb-1">
                <div className="inline-flex gap-1.5 min-w-full">
                  <div className="flex flex-col justify-between text-[10px] font-medium text-[#8E8E93] pr-2 py-0.5">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                    <span>Sun</span>
                  </div>
                  <div className="flex gap-1.5 flex-1">
                    {heatmapWeeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {week.map((day, dIdx) =>
                          day ? (
                            <div
                              key={day.date}
                              title={`${day.label}: ${day.minutes}m focused`}
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-transform hover:scale-125 ${getDotStyle(day.minutes)}`}
                            />
                          ) : (
                            <div key={`empty-${wIdx}-${dIdx}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2E2E32] text-xs text-[#8E8E93]">
              <span>Hover any dot to inspect daily focus time</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-3 h-3 rounded-[3px] bg-[#2A2A2D] border border-[#2E2E32]" />
                <span className="w-3 h-3 rounded-[3px] bg-[#5A3E24]" />
                <span className="w-3 h-3 rounded-[3px] bg-[#99541C]" />
                <span className="w-3 h-3 rounded-[3px] bg-[#E66A10]" />
                <span className="w-3 h-3 rounded-[3px] bg-[#FF841C]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Warm Amber-Tinted AI Insight Card */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#2B1D12] via-[#1F1711] to-[#1A1A1A] text-white rounded-[18px] p-6 border border-[#FF841C]/35 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#261A10] border border-[#FF841C]/40 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#FF841C]" />
                  </div>
                  <h2 className="text-base font-bold text-white">AI Insight</h2>
                </div>
                <span className="bg-[#E66A10] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Personalized
                </span>
              </div>

              {loading ? (
                <p className="text-[#8E8E93] text-sm py-6">Analyzing your recent sessions...</p>
              ) : latestInsight ? (
                <p className="text-[#D1D5DB] text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                  {latestInsight.length > 300
                    ? latestInsight.slice(0, 300) + '…'
                    : latestInsight}
                </p>
              ) : (
                <div className="bg-[#232325]/80 border border-[#2E2E32] rounded-2xl p-4">
                  <p className="text-[#D1D5DB] text-sm leading-relaxed">
                    Complete your first study session to unlock personalized focus patterns, peak-hour coaching, and distraction triggers from DayDive AI.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#FF841C]/20 flex items-center justify-between">
              <span className="text-xs text-[#8E8E93]">Updated after each session</span>
              <Link
                to="/analytics"
                className="text-[#FF841C] hover:text-white text-sm font-semibold inline-flex items-center gap-1 transition"
              >
                Full Report <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Row 3: Weekly Focus Bars + Recent Sessions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Weekly Activity</h2>
              <div className="flex items-center gap-3 text-xs text-[#8E8E93]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" /> Focused
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF841C]" /> Distracted
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-6 text-[#8E8E93] text-sm">Loading...</div>
            ) : !history90d?.has_data ? (
              <p className="text-[#8E8E93] text-sm text-center py-6">
                Complete sessions to see your 7-day focus breakdown.
              </p>
            ) : (
              <div className="space-y-2.5 mb-5">
                {weeklyDays.map((d) => {
                  const total = (d.focus_seconds || 0) + (d.distraction_seconds || 0);
                  const fw = ((d.focus_seconds || 0) / maxWeeklySec) * 100;
                  const dw = ((d.distraction_seconds || 0) / maxWeeklySec) * 100;
                  const label = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-[#8E8E93] text-xs font-medium w-8">{label}</span>
                      <div className="flex-1 h-4 bg-[#232325] border border-[#2E2E32] rounded-md overflow-hidden flex">
                        <div className="bg-[#10B981]" style={{ width: `${fw}%` }} />
                        <div className="bg-[#FF841C]" style={{ width: `${dw}%` }} />
                      </div>
                      <span className="text-white text-xs font-semibold w-11 text-right">
                        {total ? fmtDuration(total) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#2E2E32]">
              <div className="bg-[#0F2922] border border-[#10B981]/30 rounded-[12px] p-3 flex items-center gap-3">
                <TrendingUp size={16} className="text-[#10B981] flex-shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-white">{Math.floor(longestFocus / 60)} min</p>
                  <p className="text-[#8E8E93] text-[11px]">Longest Focus</p>
                </div>
              </div>
              <div className="bg-[#232325] border border-[#2E2E32] rounded-[12px] p-3 flex items-center gap-3">
                <Clock size={16} className="text-[#FF841C] flex-shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-white">{Math.floor(avgFocus / 60)} min</p>
                  <p className="text-[#8E8E93] text-[11px]">Avg Session Focus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Recent Sessions</h2>
              <Link
                to="/analytics"
                className="text-[#FF841C] text-sm font-semibold hover:text-white flex items-center gap-1 transition"
              >
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-6 text-[#8E8E93] text-sm">Loading...</div>
            ) : recentSessions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-[#8E8E93] text-sm mb-3">No study sessions recorded yet.</p>
                <Link to="/study-session/setup" className="btn-primary text-sm inline-flex items-center gap-2">
                  <Plus size={16} /> Start your first session
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSessions.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => navigate(`/analytics/session/${s.id}`)}
                    className="w-full flex items-center justify-between p-4 bg-[#232325] border border-[#2E2E32] rounded-[14px] hover:border-[#FF841C]/50 hover:bg-[#2A2A2E] transition text-left group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">{s.subject}</p>
                      <div className="flex items-center gap-3 text-[#8E8E93] text-xs mt-1">
                        <span>{Math.floor((s.actual_duration_seconds || 0) / 60)} min</span>
                        <span className="w-1 h-1 bg-[#FF841C]/50 rounded-full"></span>
                        <span>{fmtDate(s.ended_at || s.created_at)}</span>
                        <span className="w-1 h-1 bg-[#FF841C]/50 rounded-full"></span>
                        <span>{s.completed_tasks}/{s.total_tasks} tasks</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-[#8E8E93] group-hover:text-[#FF841C] transition" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

