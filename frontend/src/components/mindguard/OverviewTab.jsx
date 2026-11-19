import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Shield, Clock, Target, TrendingUp, Zap, Globe } from 'lucide-react';

const STATUS_STYLE = {
  focused:    { label: 'Focused',    color: '#10B981', bg: '#0F2922', dot: 'bg-[#10B981]' },
  attention:  { label: 'Attention',  color: '#FF841C', bg: '#261A10', dot: 'bg-[#FF841C]' },
  distracted: { label: 'Distracted', color: '#EF4444', bg: '#2D1616', dot: 'bg-[#EF4444]' },
  paused:     { label: 'Paused',     color: '#8E8E93', bg: '#232325', dot: 'bg-[#8E8E93]' },
  idle:       { label: 'Idle',       color: '#8E8E93', bg: '#232325', dot: 'bg-[#8E8E93]' },
};

export default function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await mindguardApi.status();
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
          <Shield className="text-[#8E8E93]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Session</h3>
        <p className="text-[#8E8E93] text-sm max-w-md mx-auto">
          MindGuard activates automatically when you start a study session.
        </p>
      </div>
    );
  }

  const st = STATUS_STYLE[data.current_focus_state] || STATUS_STYLE.idle;
  const remainingMin = data.remaining_seconds != null ? Math.floor(data.remaining_seconds / 60) : null;
  const focusMin = Math.floor((data.focused_seconds || 0) / 60);
  const distractMin = Math.floor((data.distraction_seconds || 0) / 60);
  const longestMin = Math.floor((data.longest_focus_seconds || 0) / 60);

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="bg-[#232325] p-8 text-center border-b border-[#2E2E32]">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: st.bg }}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${st.dot} ${data.current_focus_state === 'focused' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold" style={{ color: st.color }}>{st.label}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {data.extension_connected ? "You're Protected" : 'Monitoring'}
          </h2>
          <p className="text-[#8E8E93] text-sm">
            {data.extension_connected
              ? 'MindGuard is actively monitoring your study session.'
              : 'Waiting for browser activity from the extension.'}
          </p>

          <div className="mt-5 flex items-center justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-[#D1D5DB]">
              <Target size={16} className="text-[#FF841C]" />
              <span className="font-semibold">{data.subject}</span>
            </div>
            {remainingMin != null && (
              <div className="flex items-center gap-2 text-[#D1D5DB]">
                <Clock size={16} className="text-[#FF841C]" />
                <span>{remainingMin} min remaining</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#2E2E32]">
          <div className="p-5 text-center">
            <TrendingUp size={16} className="text-[#10B981] mx-auto mb-2" />
            <p className="text-xl font-extrabold text-white">{focusMin}m</p>
            <p className="text-[#8E8E93] text-xs">Focused</p>
          </div>
          <div className="p-5 text-center">
            <Zap size={16} className="text-[#EF4444] mx-auto mb-2" />
            <p className="text-xl font-extrabold text-white">{distractMin}m</p>
            <p className="text-[#8E8E93] text-xs">Distracted</p>
          </div>
          <div className="p-5 text-center">
            <Zap size={16} className="text-[#FF841C] mx-auto mb-2" />
            <p className="text-xl font-extrabold text-white">{data.distraction_count}</p>
            <p className="text-[#8E8E93] text-xs">Distractions</p>
          </div>
          <div className="p-5 text-center">
            <Clock size={16} className="text-white mx-auto mb-2" />
            <p className="text-xl font-extrabold text-white">{longestMin}m</p>
            <p className="text-[#8E8E93] text-xs">Longest focus</p>
          </div>
        </div>
      </div>

      {data.current_activity && (
        <div className="card p-6">
          <h3 className="text-sm font-bold text-white mb-3">Current Activity</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#232325] border border-[#2E2E32] rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe size={18} className="text-[#FF841C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{data.current_activity.domain}</p>
              {data.current_activity.page_title && (
                <p className="text-[#D1D5DB] text-xs mt-0.5 truncate">
                  &quot;{data.current_activity.page_title}&quot;
                </p>
              )}
              <p className="text-[#8E8E93] text-xs mt-1">{data.current_activity.reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}