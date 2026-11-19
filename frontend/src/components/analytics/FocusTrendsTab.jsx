import { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import { Loader2, TrendingUp } from 'lucide-react';

const RANGES = [
  { id: '7d', label: '7 Days' },
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
          <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading trends...
        </div>
      ) : !data?.has_data ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="text-[#FF841C]" size={22} />
          </div>
          <p className="text-white font-semibold">Not enough data yet</p>
          <p className="text-[#8E8E93] text-sm mt-1">Complete more sessions to see your focus trends.</p>
        </div>
      ) : (
        <>
          <div className="card p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#FF841C]" /> Daily Focus Trend
            </h3>
            {data.daily.length === 0 ? (
              <p className="text-[#8E8E93] text-sm">No activity in this range.</p>
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
                      const label = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div key={d.date} className="flex items-center gap-3">
                          <span className="text-[#8E8E93] text-xs w-16">{label}</span>
                          <div className="flex-1 h-5 bg-[#232325] rounded-md overflow-hidden flex">
                            <div className="bg-[#10B981]" style={{ width: `${(focused / maxSec) * 100}%` }} />
                            <div className="bg-[#FF841C]" style={{ width: `${(distracted / maxSec) * 100}%` }} />
                          </div>
                          <span className="text-white text-xs font-semibold w-14 text-right">{fmtDuration(total)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>

          {data.best_time_of_day && (
            <div className="card p-6">
              <h3 className="text-sm font-bold text-white mb-4">When You Focus Best</h3>
              <div className="space-y-3">
                {Object.entries(data.best_time_of_day).map(([slot, pct]) => (
                  <div key={slot} className="flex items-center gap-3">
                    <span className="text-[#8E8E93] text-xs w-32">{SLOT_LABELS[slot] || slot}</span>
                    <div className="flex-1 h-5 bg-[#232325] rounded-md overflow-hidden">
                      <div
                        className={`h-full rounded-md ${pct >= 80 ? 'bg-[#10B981]' : pct >= 60 ? 'bg-[#FF841C]' : 'bg-[#EF4444]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold w-10 text-right">{pct}%</span>
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