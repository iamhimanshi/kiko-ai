import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../services/api';
import MetricCard from './MetricCard';
import {
  Clock, Target, Zap, Calendar, Loader2, ArrowRight, Globe, TrendingUp,
} from 'lucide-react';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d',    label: 'Last 7 Days' },
  { id: '30d',   label: 'Last 30 Days' },
];

function fmtDuration(seconds) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
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
      {/* Range selector */}
      <div className="flex gap-2 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-4 py-2 rounded-[12px] text-sm font-medium transition ${
              range === r.id
                ? 'bg-[#1B4332] text-white'
                : 'bg-white border border-[#E8ECE7] text-[#4B5563] hover:bg-[#EDF4EE]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading analytics...
        </div>
      ) : !data?.has_data ? (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-12 text-center">
          <div className="text-5xl mb-3">🌱</div>
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">
            Your analytics are still growing
          </h3>
          <p className="text-[#6B7280] text-sm max-w-md mx-auto mb-6">
            Complete a few study sessions and KIKO will start showing your focus patterns,
            distractions, and progress.
          </p>
          <Link
            to="/study-session/setup"
            className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-3 rounded-[14px] font-medium transition inline-flex items-center gap-2"
          >
            Start Study Session
          </Link>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={Clock}
              label="Study Time"
              value={fmtDuration(data.total_study_seconds)}
              sublabel={`${data.sessions_count} sessions`}
              iconBg="bg-[#EEF7F0]"
              iconColor="text-[#1B4332]"
            />
            <MetricCard
              icon={Target}
              label="Focus Score"
              value={`${data.focus_score}%`}
              sublabel={data.focus_score >= 80 ? 'Excellent' : data.focus_score >= 60 ? 'Good' : 'Keep going'}
              iconBg="bg-[#EAF8EC]"
              iconColor="text-[#2E7D32]"
            />
            <MetricCard
              icon={Zap}
              label="Distraction"
              value={fmtDuration(data.total_distracted_seconds)}
              sublabel={`${data.distraction_count} events`}
              iconBg="bg-[#FFF8E8]"
              iconColor="text-[#D4A64A]"
            />
            <MetricCard
              icon={Calendar}
              label="Completed"
              value={`${data.completed_sessions}`}
              sublabel={`of ${data.sessions_count} sessions`}
              iconBg="bg-[#EDF4EE]"
              iconColor="text-[#1B4332]"
            />
          </div>

          {/* Study vs Distraction */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Study Time Breakdown</h3>
            {(() => {
              const focused = data.total_focused_seconds || 0;
              const distracted = data.total_distracted_seconds || 0;
              const total = focused + distracted;
              if (total === 0) return <p className="text-[#9CA3AF] text-sm">No activity recorded yet.</p>;
              const fp = (focused / total) * 100;
              const dp = (distracted / total) * 100;
              return (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden bg-[#EDF4EE] mb-4">
                    {focused > 0 && <div className="bg-[#2E7D32] transition-all" style={{ width: `${fp}%` }} />}
                    {distracted > 0 && <div className="bg-[#D14343] transition-all" style={{ width: `${dp}%` }} />}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2E7D32]" />
                      <span className="text-[#6B7280]">Focused</span>
                      <span className="text-[#1F2937] font-medium ml-auto">{fmtDuration(focused)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#D14343]" />
                      <span className="text-[#6B7280]">Distracted</span>
                      <span className="text-[#1F2937] font-medium ml-auto">{fmtDuration(distracted)}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Longest Focus + Top Distracting */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Longest Focus */}
            <div className="bg-gradient-to-br from-[#EEF7F0] to-[#F8F7F2] border border-[#1B4332]/15 rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-[#1B4332]" size={18} />
                <h3 className="text-sm font-semibold text-[#1F2937]">Longest Focus Period</h3>
              </div>
              <p className="text-4xl font-bold text-[#1B4332] mb-1">
                {Math.floor((data.longest_focus_seconds || 0) / 60)}
                <span className="text-lg text-[#4B5563] font-medium ml-1">min</span>
              </p>
              <p className="text-[#6B7280] text-xs">
                Your longest uninterrupted focus this range.
              </p>
            </div>

            {/* Top Distracting Websites */}
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <h3 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Zap size={16} className="text-[#D14343]" />
                Most Distracted Websites
              </h3>
              {data.top_distracting.length === 0 ? (
                <p className="text-[#9CA3AF] text-sm">No distractions yet. 🎯</p>
              ) : (
                <div className="space-y-3">
                  {data.top_distracting.map((d, i) => (
                    <div key={d.domain} className="flex items-center gap-3">
                      <span className="text-[#9CA3AF] text-xs font-bold w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1F2937] text-sm font-medium truncate">{d.domain}</p>
                        <div className="w-full h-1.5 bg-[#FDECEC] rounded-full mt-1">
                          <div
                            className="h-full bg-[#D14343] rounded-full"
                            style={{
                              width: `${Math.min((d.distraction_seconds / (data.top_distracting[0].distraction_seconds || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[#1F2937] text-xs font-medium">
                          {d.distraction_count}×
                        </p>
                        <p className="text-[#9CA3AF] text-[10px]">
                          {fmtDuration(d.distraction_seconds)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Daily Focus */}
          {data.daily_focus.length > 0 && (
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Daily Focus</h3>
              {(() => {
                const maxSec = Math.max(
                  ...data.daily_focus.map((d) => (d.focus_seconds || 0) + (d.distraction_seconds || 0)),
                  1
                );
                return (
                  <div className="space-y-2.5">
                    {data.daily_focus.slice(-7).map((d) => {
                      const focused = d.focus_seconds || 0;
                      const distracted = d.distraction_seconds || 0;
                      const total = focused + distracted;
                      const fw = (focused / maxSec) * 100;
                      const dw = (distracted / maxSec) * 100;
                      const label = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-[#6B7280] text-xs w-10">{label}</span>
                          <div className="flex-1 h-6 bg-[#F8F7F2] rounded-md overflow-hidden flex">
                            <div className="bg-[#2E7D32]" style={{ width: `${fw}%` }} />
                            <div className="bg-[#D14343]" style={{ width: `${dw}%` }} />
                          </div>
                          <span className="text-[#4B5563] text-xs w-14 text-right">
                            {fmtDuration(total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Website Activity */}
          {data.top_websites.length > 0 && (
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <h3 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#1B4332]" />
                Website Activity
              </h3>
              <div className="space-y-2">
                {data.top_websites.slice(0, 6).map((w) => {
                  const isDistracting = w.distraction_seconds > w.seconds / 2;
                  return (
                    <div key={w.domain} className="flex items-center justify-between gap-3 py-2 border-b border-[#E8ECE7]/50 last:border-0">
                      <span className="text-[#1F2937] text-sm truncate flex-1">{w.domain}</span>
                      <span className="text-[#6B7280] text-xs">{fmtDuration(w.seconds)}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isDistracting
                            ? 'bg-[#FDECEC] text-[#D14343]'
                            : 'bg-[#EAF8EC] text-[#2E7D32]'
                        }`}
                      >
                        {isDistracting ? 'Distracting' : 'Relevant'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {data.recent_sessions.length > 0 && (
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1F2937]">Recent Sessions</h3>
                <Link to="/study-session" className="text-[#1B4332] text-xs font-medium hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {data.recent_sessions.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    to={`/analytics/session/${s.id}`}
                    className="flex items-center justify-between gap-3 p-3 bg-[#F8F7F2] rounded-[12px] hover:bg-[#EEF7F0] transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[#1F2937] text-sm font-medium truncate">{s.subject}</p>
                      <p className="text-[#9CA3AF] text-xs truncate">{s.goal}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#1F2937] text-xs font-medium">
                        {Math.floor((s.actual_duration_seconds || 0) / 60)}m
                      </p>
                      <p className="text-[#9CA3AF] text-[10px]">
                        {s.completed_tasks}/{s.total_tasks} tasks
                      </p>
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