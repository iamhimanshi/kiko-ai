import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Radio, Check, AlertTriangle, Clock, Globe, HelpCircle, Target } from 'lucide-react';

const CLASS_STYLE = {
  relevant:    { icon: Check,         color: '#10B981', bg: '#0F2922', label: 'Relevant' },
  uncertain:   { icon: HelpCircle,    color: '#FF841C', bg: '#261A10', label: 'Uncertain' },
  distracting: { icon: AlertTriangle, color: '#EF4444', bg: '#2D1616', label: 'Distracting' },
};

function fmtSeconds(s) {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  return m < 1 ? `${s}s` : `${m}m`;
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
      <div className="flex items-center justify-center py-16 text-[#8E8E93] gap-2">
        <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading...
      </div>
    );
  }

  if (!data?.has_active_session) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-[#232325] border border-[#2E2E32] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Radio className="text-[#8E8E93]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nothing to Monitor</h3>
        <p className="text-[#8E8E93] text-sm max-w-md mx-auto">
          Start a study session to see live browser activity here.
        </p>
      </div>
    );
  }

  const current = data.current_activity;
  const curClass = current?.classification || 'uncertain';
  const curStyle = CLASS_STYLE[curClass] || CLASS_STYLE.uncertain;
  const CurIcon = curStyle.icon;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#8E8E93] text-xs uppercase tracking-wider font-bold mb-0.5">Session</p>
            <p className="text-white font-semibold">{data.subject}</p>
          </div>
          <div className="flex items-center gap-2 text-[#10B981] text-xs font-semibold bg-[#0F2922] border border-[#10B981]/30 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {current ? (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Current Activity</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#232325] border border-[#2E2E32] rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe size={20} className="text-[#FF841C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{current.domain}</p>
              {current.page_title && (
                <p className="text-[#D1D5DB] text-sm mt-0.5 truncate">&quot;{current.page_title}&quot;</p>
              )}
              <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: curStyle.bg, color: curStyle.color }}
                >
                  <CurIcon size={12} /> {curStyle.label}
                </span>
                <span className="text-[#8E8E93] text-xs flex items-center gap-1">
                  <Clock size={12} />
                  {fmtSeconds(current.time_on_page_seconds)}
                </span>
              </div>
              {current.reason && <p className="text-[#8E8E93] text-xs mt-2">{current.reason}</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-[#8E8E93] text-sm">Waiting for activity from the extension...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Recent Activity</h3>
          {data.recent_activity.length === 0 ? (
            <p className="text-[#8E8E93] text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_activity.map((a, i) => {
                const s = CLASS_STYLE[a.classification] || CLASS_STYLE.uncertain;
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#2E2E32] last:border-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
                      <Icon size={13} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{a.domain}</p>
                      {a.page_title && <p className="text-[#8E8E93] text-xs truncate">{a.page_title}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-xs font-semibold">{fmtSeconds(a.time_spent_seconds)}</p>
                      <p className="text-[#8E8E93] text-[10px]">{timeAgo(a.recorded_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold text-white mb-4">Recent Distractions</h3>
          {data.recent_distractions.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-[#0F2922] border border-[#10B981]/30 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                <Target size={18} className="text-[#10B981]" />
              </div>
              <p className="text-[#8E8E93] text-sm">You&apos;ve been focused. No distractions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recent_distractions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#2E2E32] last:border-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#2D1616]">
                    <AlertTriangle size={13} className="text-[#EF4444]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{a.domain}</p>
                    {a.page_title && <p className="text-[#8E8E93] text-xs truncate">{a.page_title}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-xs font-semibold">{fmtSeconds(a.time_spent_seconds)}</p>
                    <p className="text-[#8E8E93] text-[10px]">{timeAgo(a.recorded_at)}</p>
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