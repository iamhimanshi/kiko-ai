import { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { Loader2, TrendingUp } from 'lucide-react';

const RANGES = [
  { id: '7d',  label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
];

function fmtDuration(seconds) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function FocusTrendsTab() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.focusTrends(range);
        setData(res.data);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
  }, [range]);

  const SLOT_LABELS = {
    morning: 'Morning (6–12)',
    afternoon: 'Afternoon (12–18)',
    evening: 'Evening (18–24)',
    night: 'Night (0–6)',
  };

  return (
    <div className="space-y-6">
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
          <Loader2 size={18} className="animate-spin" /> Loading trends...
        </div>
      ) : !data?.has_data ? (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-12 text-center">
          <div className="text-5xl mb-3">📈</div>
          <p className="text-[#1F2937] font-medium">Not enough data yet</p>
          <p className="text-[#6B7280] text-sm mt-1">
            Complete more sessions to see your focus trends.
          </p>
        </div>
      ) : (
        <>
          {/* Daily trend */}
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
            <h3 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#1B4332]" />
              Daily Focus Trend
            </h3>
            {data.daily.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm">No activity in this range.</p>
            ) : (
              (() => {
                const maxSec = Math.max(
                  ...data.daily.map((d) => (d.focus_seconds || 0) + (d.distraction_seconds || 0)),
                  1
                );
                return (
                  <div className="space-y-2.5">
                    {data.daily.map((d) => {
                      const focused = d.focus_seconds || 0;
                      const distracted = d.distraction_seconds || 0;
                      const total = focused + distracted;
                      const label = new Date(d.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      });
                      return (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-[#6B7280] text-xs w-16">{label}</span>
                          <div className="flex-1 h-6 bg-[#F8F7F2] rounded-md overflow-hidden flex">
                            <div
                              className="bg-[#2E7D32]"
                              style={{ width: `${(focused / maxSec) * 100}%` }}
                            />
                            <div
                              className="bg-[#D14343]"
                              style={{ width: `${(distracted / maxSec) * 100}%` }}
                            />
                          </div>
                          <span className="text-[#4B5563] text-xs w-14 text-right">
                            {fmtDuration(total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>

          {/* Best time of day */}
          {data.best_time_of_day && (
            <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
              <h3 className="text-sm font-semibold text-[#1F2937] mb-4">When You Focus Best</h3>
              <div className="space-y-3">
                {Object.entries(data.best_time_of_day).map(([slot, pct]) => (
                  <div key={slot} className="flex items-center gap-3">
                    <span className="text-[#6B7280] text-xs w-28">{SLOT_LABELS[slot] || slot}</span>
                    <div className="flex-1 h-6 bg-[#F8F7F2] rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md ${
                          pct >= 80 ? 'bg-[#2E7D32]' : pct >= 60 ? 'bg-[#D4A64A]' : 'bg-[#D14343]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[#4B5563] text-xs w-10 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}