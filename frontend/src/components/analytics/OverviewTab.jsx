import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../services/api';
import MetricCard from './MetricCard';
import { Clock, Target, Zap, Calendar, Loader2, ArrowRight, Globe, TrendingUp } from 'lucide-react';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
];

function fmtDuration(seconds) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

function SegmentedArcGauge({ score = 0 }) {
  const totalSegments = 18;
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * totalSegments);
  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg viewBox="0 0 220 125" className="w-52 h-28 overflow-visible">
        {Array.from({ length: totalSegments }).map((_, i) => {
          const angle = Math.PI + (i / (totalSegments - 1)) * Math.PI;
          const r1 = 68;
          const r2 = 88;
          const x1 = 110 + r1 * Math.cos(angle);
          const y1 = 105 + r1 * Math.sin(angle);
          const x2 = 110 + r2 * Math.cos(angle);
          const y2 = 105 + r2 * Math.sin(angle);
          const active = i < filled;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active ? (score >= 75 ? '#10B981' : '#FF841C') : '#2E2E32'}
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="-mt-12 text-center">
        <p className="text-3xl font-extrabold text-white">{score}%</p>
        <p className="text-[#8E8E93] text-xs mt-0.5">Focus Quality Score</p>
      </div>
    </div>
  );
}

function DailyActivityAreaChart({ daily = [] }) {
  const pts = daily.slice(-10);
  if (pts.length === 0) return <p className="text-[#8E8E93] text-sm">No daily data yet.</p>;

  const w = 520;
  const h = 150;
  const pad = 16;
  const values = pts.map((d) => Math.round((d.focus_seconds || 0) / 60));
  const maxVal = Math.max(...values, 10);

  const coords = values.map((v, idx) => {
    const x = pts.length === 1 ? w / 2 : pad + (idx / (pts.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / maxVal) * (h - pad * 2);
    return { x, y, v, date: pts[idx].date };
  });

  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - pad} L ${coords[0].x} ${h - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        <defs>
          <linearGradient id="amberArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF841C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF841C" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#amberArea)" />
        <path d={linePath} fill="none" stroke="#FF841C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#121212" stroke="#FF841C" strokeWidth="2">
            <title>{`${new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${p.v}m focused`}</title>
          </circle>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[#8E8E93] px-2 mt-1">
        {pts.map((d) => (
          <span key={d.date}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.overview(range);
        setData(res.data);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`px-4 py-2 rounded-[12px] text-sm font-semibold transition ${
              range === r.id
                ? 'bg-[#E66A10] text-white'
                : 'bg-[#1A1A1A] border border-[#2E2E32] text-[#8E8E93] hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#8E8E93] gap-2">
          <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading analytics...
        </div>
      ) : !data?.has_data ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="text-[#FF841C]" size={22} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your analytics are still growing</h3>
          <p className="text-[#8E8E93] text-sm max-w-md mx-auto mb-6">
            Complete a few study sessions and DayDive will show your focus patterns, distractions, and progress.
          </p>
          <Link to="/study-session/setup" className="btn-primary inline-flex items-center gap-2">
            Start Study Session
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <MetricCard icon={Clock} label="Study Time" value={fmtDuration(data.total_study_seconds)} sublabel={`${data.sessions_count} sessions`} iconBg="bg-[#261A10]" iconColor="text-[#FF841C]" />
            <MetricCard icon={Target} label="Focus Score" value={`${data.focus_score}%`} sublabel={data.focus_score >= 80 ? 'Excellent' : data.focus_score >= 60 ? 'Good' : 'Keep going'} iconBg="bg-[#0F2922]" iconColor="text-[#10B981]" />
            <MetricCard icon={Zap} label="Distraction" value={fmtDuration(data.total_distracted_seconds)} sublabel={`${data.distraction_count} events`} iconBg="bg-[#2D1616]" iconColor="text-[#EF4444]" />
            <MetricCard icon={Calendar} label="Completed" value={`${data.completed_sessions}`} sublabel={`of ${data.sessions_count} sessions`} iconBg="bg-[#232325]" iconColor="text-white" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Daily Focus Activity</h3>
                <span className="text-xs text-[#8E8E93]">Minutes focused per day</span>
              </div>
              <DailyActivityAreaChart daily={data.daily_focus || []} />
            </div>

            <div className="lg:col-span-4 card p-6 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white mb-2">Quality Score</h3>
              <SegmentedArcGauge score={data.focus_score || 0} />
              <div className="pt-3 border-t border-[#2E2E32] flex justify-between text-xs text-[#8E8E93]">
                <span>Longest streak</span>
                <span className="text-white font-semibold">{Math.floor((data.longest_focus_seconds || 0) / 60)} min</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-white mb-4">Study Time Breakdown</h3>
              {(() => {
                const focused = data.total_focused_seconds || 0;
                const distracted = data.total_distracted_seconds || 0;
                const total = focused + distracted;
                if (total === 0) return <p className="text-[#8E8E93] text-sm">No activity recorded yet.</p>;
                return (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden bg-[#232325] mb-4">
                      {focused > 0 && <div className="bg-[#10B981]" style={{ width: `${(focused / total) * 100}%` }} />}
                      {distracted > 0 && <div className="bg-[#FF841C]" style={{ width: `${(distracted / total) * 100}%` }} />}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                        <span className="text-[#8E8E93]">Focused</span>
                        <span className="text-white font-semibold ml-auto">{fmtDuration(focused)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF841C]" />
                        <span className="text-[#8E8E93]">Distracted</span>
                        <span className="text-white font-semibold ml-auto">{fmtDuration(distracted)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="card p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap size={16} className="text-[#FF841C]" /> Most Distracted Websites
              </h3>
              {data.top_distracting.length === 0 ? (
                <p className="text-[#8E8E93] text-sm">No distractions logged in this period.</p>
              ) : (
                <div className="space-y-3">
                  {data.top_distracting.map((d, i) => (
                    <div key={d.domain} className="flex items-center gap-3">
                      <span className="text-[#8E8E93] text-xs font-bold w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{d.domain}</p>
                        <div className="w-full h-1.5 bg-[#232325] rounded-full mt-1">
                          <div
                            className="h-full bg-[#FF841C] rounded-full"
                            style={{ width: `${Math.min((d.distraction_seconds / (data.top_distracting[0].distraction_seconds || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-xs font-semibold">{d.distraction_count}×</p>
                        <p className="text-[#8E8E93] text-[10px]">{fmtDuration(d.distraction_seconds)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {data.top_websites.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#FF841C]" /> Website Activity
              </h3>
              <div className="space-y-2">
                {data.top_websites.slice(0, 6).map((w) => {
                  const isDistracting = w.distraction_seconds > w.seconds / 2;
                  return (
                    <div key={w.domain} className="flex items-center justify-between gap-3 py-2 border-b border-[#2E2E32] last:border-0">
                      <span className="text-white text-sm truncate flex-1">{w.domain}</span>
                      <span className="text-[#8E8E93] text-xs">{fmtDuration(w.seconds)}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isDistracting ? 'bg-[#2D1616] text-[#EF4444]' : 'bg-[#0F2922] text-[#10B981]'}`}>
                        {isDistracting ? 'Distracting' : 'Relevant'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.recent_sessions.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Recent Sessions</h3>
                <Link to="/study-session" className="text-[#FF841C] text-xs font-semibold hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {data.recent_sessions.slice(0, 5).map((s) => (
                  <Link key={s.id} to={`/analytics/session/${s.id}`} className="flex items-center justify-between gap-3 p-3.5 bg-[#232325] border border-[#2E2E32] rounded-[12px] hover:border-[#FF841C]/50 transition">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">{s.subject}</p>
                      <p className="text-[#8E8E93] text-xs truncate">{s.goal}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-xs font-semibold">{Math.floor((s.actual_duration_seconds || 0) / 60)}m</p>
                      <p className="text-[#8E8E93] text-[10px]">{s.completed_tasks}/{s.total_tasks} tasks</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}