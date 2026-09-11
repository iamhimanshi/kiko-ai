import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Radio, Check, AlertTriangle, Clock } from 'lucide-react';

const CLASS_STYLE = {
  relevant:    { icon: Check,        color: '#2E7D32', bg: '#EAF8EC' },
  uncertain:   { icon: AlertTriangle,color: '#D97706', bg: '#FFF6E4' },
  distracting: { icon: AlertTriangle,color: '#D14343', bg: '#FDECEC' },
};

function fmtSeconds(s) {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  if (m < 1) return `${s}s`;
  return `${m}m`;
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveMonitorTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await mindguardApi.live();
        setData(res.data);
      } catch { /* */ }
      finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (!data?.has_active_session) {
    return (
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-10 text-center">
        <div className="w-16 h-16 bg-[#F8F7F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Radio className="text-[#6B7280]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#1F2937] mb-2">Nothing to Monitor</h3>
        <p className="text-[#6B7280] text-sm max-w-md mx-auto">
          Start a study session to see live browser activity here.
        </p>
      </div>
    );
  }

  const current = data.current_activity;
  const curClass = current?.classification || 'uncertain';
  const curStyle = CLASS_STYLE[curClass];

  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium mb-0.5">Session</p>
            <p className="text-[#1F2937] font-semibold">{data.subject}</p>
          </div>
          <div className="flex items-center gap-2 text-[#1B4332] text-xs font-medium bg-[#EEF7F0] px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Current activity */}
      {current ? (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Current Activity</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#EEF7F0] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🌐</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1F2937] font-medium">{current.domain}</p>
              {current.page_title && (
                <p className="text-[#4B5563] text-sm mt-0.5 truncate">
                  "{current.page_title}"
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: curStyle.bg, color: curStyle.color }}
                >
                  {curClass === 'relevant' ? '✓ Relevant' : curClass === 'distracting' ? '⚠ Distracting' : '? Uncertain'}
                </span>
                <span className="text-[#6B7280] text-xs flex items-center gap-1">
                  <Clock size={12} />
                  {fmtSeconds(current.time_on_page_seconds)}
                </span>
              </div>
              {current.reason && (
                <p className="text-[#6B7280] text-xs mt-2">{current.reason}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6 text-center">
          <p className="text-[#6B7280] text-sm">Waiting for activity from the extension...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Recent Activity</h3>
          {data.recent_activity.length === 0 ? (
            <p className="text-[#9CA3AF] text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_activity.map((a, i) => {
                const s = CLASS_STYLE[a.classification] || CLASS_STYLE.uncertain;
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#E8ECE7]/50 last:border-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: s.bg }}
                    >
                      <Icon size={12} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1F2937] text-sm truncate">{a.domain}</p>
                      {a.page_title && (
                        <p className="text-[#9CA3AF] text-xs truncate">{a.page_title}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#6B7280] text-xs">{fmtSeconds(a.time_spent_seconds)}</p>
                      <p className="text-[#9CA3AF] text-[10px]">{timeAgo(a.recorded_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent distractions */}
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Recent Distractions</h3>
          {data.recent_distractions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-[#6B7280] text-sm">You've been focused. No distractions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recent_distractions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-[#E8ECE7]/50 last:border-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#FDECEC]">
                    <AlertTriangle size={12} className="text-[#D14343]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1F2937] text-sm truncate">{a.domain}</p>
                    {a.page_title && (
                      <p className="text-[#9CA3AF] text-xs truncate">{a.page_title}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[#6B7280] text-xs">{fmtSeconds(a.time_spent_seconds)}</p>
                    <p className="text-[#9CA3AF] text-[10px]">{timeAgo(a.recorded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}