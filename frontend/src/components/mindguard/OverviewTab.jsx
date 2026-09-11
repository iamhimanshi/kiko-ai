import { useState, useEffect } from 'react';
import { mindguardApi } from '../../services/api';
import { Loader2, Shield, Clock, Target, TrendingUp, Zap } from 'lucide-react';

const STATUS_STYLE = {
  focused:    { label: 'Focused',    color: '#2E7D32', bg: '#EAF8EC', dot: 'bg-[#2E7D32]' },
  attention:  { label: 'Attention',  color: '#D97706', bg: '#FFF6E4', dot: 'bg-[#D97706]' },
  distracted: { label: 'Distracted', color: '#D14343', bg: '#FDECEC', dot: 'bg-[#D14343]' },
  paused:     { label: 'Paused',     color: '#6B7280', bg: '#F3F4F6', dot: 'bg-[#6B7280]' },
  idle:       { label: 'Idle',       color: '#6B7280', bg: '#F3F4F6', dot: 'bg-[#6B7280]' },
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
      <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (!data?.has_active_session) {
    return (
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-10 text-center">
        <div className="w-16 h-16 bg-[#F8F7F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="text-[#6B7280]" size={28} />
        </div>
        <h3 className="text-xl font-bold text-[#1F2937] mb-2">No Active Session</h3>
        <p className="text-[#6B7280] text-sm max-w-md mx-auto">
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
      {/* Main status card */}
      <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 overflow-hidden">
        <div className="bg-gradient-to-br from-[#EEF7F0] to-[#F8F7F2] p-8 text-center border-b border-[#E8ECE7]/50">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ backgroundColor: st.bg }}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${st.dot} ${data.current_focus_state === 'focused' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium" style={{ color: st.color }}>
              {st.label}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-1">
            {data.extension_connected ? 'You\'re Protected' : 'Monitoring'}
          </h2>
          <p className="text-[#6B7280] text-sm">
            {data.extension_connected
              ? 'MindGuard is actively monitoring your study session.'
              : 'Waiting for browser activity from the extension.'}
          </p>

          <div className="mt-5 flex items-center justify-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-[#4B5563]">
              <Target size={16} className="text-[#1B4332]" />
              <span className="font-medium">{data.subject}</span>
            </div>
            {remainingMin != null && (
              <div className="flex items-center gap-2 text-[#4B5563]">
                <Clock size={16} className="text-[#1B4332]" />
                <span>{remainingMin} min remaining</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E8ECE7]/50">
          <div className="p-5 text-center">
            <TrendingUp size={16} className="text-[#2E7D32] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#1F2937]">{focusMin}m</p>
            <p className="text-[#6B7280] text-xs">Focused</p>
          </div>
          <div className="p-5 text-center">
            <Zap size={16} className="text-[#D14343] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#1F2937]">{distractMin}m</p>
            <p className="text-[#6B7280] text-xs">Distracted</p>
          </div>
          <div className="p-5 text-center">
            <Zap size={16} className="text-[#D4A64A] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#1F2937]">{data.distraction_count}</p>
            <p className="text-[#6B7280] text-xs">Distractions</p>
          </div>
          <div className="p-5 text-center">
            <Clock size={16} className="text-[#1B4332] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#1F2937]">{longestMin}m</p>
            <p className="text-[#6B7280] text-xs">Longest focus</p>
          </div>
        </div>
      </div>

      {/* Current activity */}
      {data.current_activity && (
        <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-6">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-3">Current Activity</h3>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#EEF7F0] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-[#1B4332] font-bold text-sm">🌐</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#1F2937] font-medium text-sm truncate">
                {data.current_activity.domain}
              </p>
              {data.current_activity.page_title && (
                <p className="text-[#6B7280] text-xs mt-0.5 truncate">
                  "{data.current_activity.page_title}"
                </p>
              )}
              <p className="text-[#6B7280] text-xs mt-1">
                {data.current_activity.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}