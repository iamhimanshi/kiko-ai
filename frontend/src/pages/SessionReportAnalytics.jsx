import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { analyticsApi } from '../services/api';
import {
  ArrowLeft, Clock, Target, Zap, CheckCircle, Circle,
  AlertTriangle, Globe, Brain, Loader2, Shield,
} from 'lucide-react';

function fmt(seconds) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 > 0 ? `${h}h ${m % 60}m` : `${h}h`;
}

const STATE_COLOR = {
  focused:    '#2E7D32',
  uncertain:  '#D4A64A',
  distracted: '#D14343',
};

export default function SessionReportAnalytics() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsApi.sessionReport(sessionId);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load session.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Loader2 size={18} className="animate-spin" /> Loading report...
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-8 max-w-md text-center">
            <AlertTriangle className="text-[#D14343] mx-auto mb-3" size={40} />
            <p className="text-[#1F2937] font-medium mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/analytics')}
              className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-2.5 rounded-[14px] font-medium transition"
            >
              Back to Analytics
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { session, metrics, focus_timeline, website_activity, distraction_events, blocked_attempts, ai_insights } = data;
  const durationMin = Math.floor((session.actual_duration_seconds || 0) / 60);
  const focusedMin = Math.floor((metrics.focused_seconds || 0) / 60);
  const distractedMin = Math.floor((metrics.distracted_seconds || 0) / 60);
  const longestMin = Math.floor((metrics.longest_focus_seconds || 0) / 60);

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition mb-6 text-sm"
          >
            <ArrowLeft size={16} /> Back to Analytics
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1F2937]">{session.subject}</h1>
            <p className="text-[#6B7280] text-sm mt-1">{session.goal}</p>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                session.status === 'COMPLETED'
                  ? 'bg-[#EAF8EC] text-[#2E7D32]'
                  : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>
                {session.status}
              </span>
              <span className="text-[#9CA3AF]">
                {session.created_at ? new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                }) : ''}
              </span>
              <span className="text-[#9CA3AF]">·</span>
              <span className="text-[#9CA3AF]">{durationMin} min</span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-5 text-center">
              <Clock size={18} className="text-[#1B4332] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">{durationMin}</p>
              <p className="text-[#6B7280] text-xs">min studied</p>
            </div>
            <div className="bg-[#EAF8EC] rounded-[18px] border border-[#2E7D32]/20 p-5 text-center">
              <Target size={18} className="text-[#2E7D32] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#2E7D32]">{metrics.focus_score}%</p>
              <p className="text-[#4B5563] text-xs">focus score</p>
            </div>
            <div className="bg-[#FFF8E8] rounded-[18px] border border-[#D4A64A]/30 p-5 text-center">
              <Zap size={18} className="text-[#D4A64A] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#4D3A11]">{distractedMin}</p>
              <p className="text-[#4B5563] text-xs">min distracted</p>
            </div>
            <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-5 text-center">
              <CheckCircle size={18} className="text-[#1B4332] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1F2937]">
                {session.completed_tasks}/{session.total_tasks}
              </p>
              <p className="text-[#6B7280] text-xs">tasks done</p>
            </div>
          </div>

          {/* Goal + Tasks */}
          <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-6 mb-6">
            <h2 className="text-sm font-semibold text-[#1F2937] mb-3">Your Goal</h2>
            <p className="text-[#4B5563] text-sm mb-4">{session.goal}</p>
            {session.tasks?.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[#E8ECE7]/50">
                {session.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    {t.is_completed
                      ? <CheckCircle size={16} className="text-[#2E7D32] flex-shrink-0" />
                      : <Circle size={16} className="text-[#9CA3AF] flex-shrink-0" />}
                    <span className={t.is_completed ? 'text-[#9CA3AF] line-through' : 'text-[#4B5563]'}>
                      {t.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Focus Timeline */}
          {focus_timeline.length > 0 && (
            <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-6 mb-6">
              <h2 className="text-sm font-semibold text-[#1F2937] mb-4">Focus Timeline</h2>
              <div className="flex h-8 rounded-lg overflow-hidden">
                {focus_timeline.map((seg, i) => {
                  const total = focus_timeline.reduce((s, x) => s + (x.seconds || 0), 1);
                  const w = ((seg.seconds || 0) / total) * 100;
                  return (
                    <div
                      key={i}
                      title={`${seg.state} · ${seg.domain || ''} · ${seg.seconds}s`}
                      style={{
                        width: `${w}%`,
                        backgroundColor: STATE_COLOR[seg.state] || '#9CA3AF',
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                  <span className="text-[#6B7280]">Focused</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A64A]" />
                  <span className="text-[#6B7280]">Uncertain</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D14343]" />
                  <span className="text-[#6B7280]">Distracted</span>
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#E8ECE7]/50">
                <div>
                  <p className="text-[#9CA3AF] text-xs">Focused time</p>
                  <p className="text-[#1F2937] font-semibold">{focusedMin} min</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-xs">Longest focus</p>
                  <p className="text-[#1F2937] font-semibold">{longestMin} min</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-xs">Distractions</p>
                  <p className="text-[#1F2937] font-semibold">{metrics.distraction_count}</p>
                </div>
              </div>
            </div>
          )}

          {/* Website Activity */}
          {website_activity.length > 0 && (
            <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-6 mb-6">
              <h2 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#1B4332]" />
                Websites During Session
              </h2>
              <div className="space-y-2">
                {website_activity.slice(0, 10).map((w) => (
                  <div
                    key={w.domain}
                    className="flex items-center justify-between gap-3 py-2 border-b border-[#E8ECE7]/50 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[#1F2937] text-sm font-medium truncate">{w.domain}</p>
                      {w.sample_title && (
                        <p className="text-[#9CA3AF] text-xs truncate">{w.sample_title}</p>
                      )}
                    </div>
                    <span className="text-[#6B7280] text-xs flex-shrink-0">{fmt(w.seconds)}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      w.status === 'distracting'
                        ? 'bg-[#FDECEC] text-[#D14343]'
                        : 'bg-[#EAF8EC] text-[#2E7D32]'
                    }`}>
                      {w.status === 'distracting' ? 'Distracting' : 'Relevant'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distraction Events */}
          {distraction_events.length > 0 && (
            <div className="bg-white rounded-[18px] border border-[#E8ECE7]/30 p-6 mb-6">
              <h2 className="text-sm font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#D14343]" />
                Distraction Events
              </h2>
              <div className="space-y-3">
                {distraction_events.slice(0, 10).map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-[#E8ECE7]/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-[#1F2937] text-sm font-medium truncate">{d.domain}</p>
                      {d.page_title && (
                        <p className="text-[#9CA3AF] text-xs truncate">{d.page_title}</p>
                      )}
                      {d.reason && (
                        <p className="text-[#6B7280] text-xs italic mt-0.5">{d.reason}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#6B7280] text-xs">{fmt(d.seconds)}</p>
                      {d.recorded_at && (
                        <p className="text-[#9CA3AF] text-[10px]">
                          {new Date(d.recorded_at).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Attempts */}
          {blocked_attempts.length > 0 && (
            <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-6 mb-6">
              <h2 className="text-sm font-semibold text-[#4D3A11] mb-4 flex items-center gap-2">
                <Shield size={16} className="text-[#D4A64A]" />
                Blocked Attempts ({blocked_attempts.length})
              </h2>
              <div className="space-y-2">
                {blocked_attempts.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5">
                    <span className="text-[#4D3A11] font-medium">{b.domain}</span>
                    {b.recorded_at && (
                      <span className="text-[#6B7280] text-xs">
                        {new Date(b.recorded_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {ai_insights && (
            <div className="bg-[#FFF8E8] border border-[#D4A64A]/30 rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-[#D4A64A]" />
                <h2 className="text-sm font-semibold text-[#4D3A11]">KIKO's Take</h2>
              </div>
              <div className="text-[#4B5563] text-sm leading-relaxed whitespace-pre-wrap">
                {ai_insights}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}