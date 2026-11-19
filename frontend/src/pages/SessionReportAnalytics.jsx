import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  focused:    '#10B981',
  uncertain:  '#FF841C',
  distracted: '#EF4444',
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
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#8E8E93]">
            <Loader2 size={18} className="animate-spin text-[#FF841C]" /> Loading report...
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="card p-8 max-w-md text-center">
            <AlertTriangle className="text-[#EF4444] mx-auto mb-3" size={40} />
            <p className="text-white font-semibold mb-4">{error || 'Session not found'}</p>
            <button type="button" onClick={() => navigate('/analytics')} className="btn-primary">
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
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Analytics
          </button>

          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white">{session.subject}</h1>
            <p className="text-[#8E8E93] text-sm mt-1">{session.goal}</p>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                session.status === 'COMPLETED'
                  ? 'bg-[#0F2922] text-[#10B981]'
                  : 'bg-[#232325] text-[#8E8E93]'
              }`}>
                {session.status}
              </span>
              <span className="text-[#8E8E93]">
                {session.created_at ? new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                }) : ''}
              </span>
              <span className="text-[#8E8E93]">·</span>
              <span className="text-[#8E8E93]">{durationMin} min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-5 text-center">
              <Clock size={18} className="text-[#FF841C] mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-white">{durationMin}</p>
              <p className="text-[#8E8E93] text-xs">min studied</p>
            </div>
            <div className="bg-[#0F2922] rounded-[18px] border border-[#10B981]/30 p-5 text-center">
              <Target size={18} className="text-[#10B981] mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-[#10B981]">{metrics.focus_score}%</p>
              <p className="text-[#D1D5DB] text-xs">focus score</p>
            </div>
            <div className="bg-[#261A10] rounded-[18px] border border-[#FF841C]/30 p-5 text-center">
              <Zap size={18} className="text-[#FF841C] mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-white">{distractedMin}</p>
              <p className="text-[#8E8E93] text-xs">min distracted</p>
            </div>
            <div className="card p-5 text-center">
              <CheckCircle size={18} className="text-[#10B981] mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-white">{session.completed_tasks}/{session.total_tasks}</p>
              <p className="text-[#8E8E93] text-xs">tasks done</p>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h2 className="text-sm font-bold text-white mb-3">Your Goal</h2>
            <p className="text-[#D1D5DB] text-sm mb-4">{session.goal}</p>
            {session.tasks?.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[#2E2E32]">
                {session.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    {t.is_completed
                      ? <CheckCircle size={16} className="text-[#10B981] flex-shrink-0" />
                      : <Circle size={16} className="text-[#8E8E93] flex-shrink-0" />}
                    <span className={t.is_completed ? 'text-[#8E8E93] line-through' : 'text-white'}>{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {focus_timeline.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-sm font-bold text-white mb-4">Focus Timeline</h2>
              <div className="flex h-8 rounded-lg overflow-hidden bg-[#232325]">
                {focus_timeline.map((seg, i) => {
                  const total = focus_timeline.reduce((s, x) => s + (x.seconds || 0), 1);
                  const w = ((seg.seconds || 0) / total) * 100;
                  return (
                    <div
                      key={i}
                      title={`${seg.state} · ${seg.domain || ''} · ${seg.seconds}s`}
                      style={{ width: `${w}%`, backgroundColor: STATE_COLOR[seg.state] || '#8E8E93' }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-4 mt-3 text-xs flex-wrap text-[#8E8E93]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Focused</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF841C]" /> Uncertain</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Distracted</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#2E2E32]">
                <div>
                  <p className="text-[#8E8E93] text-xs">Focused time</p>
                  <p className="text-white font-semibold">{focusedMin} min</p>
                </div>
                <div>
                  <p className="text-[#8E8E93] text-xs">Longest focus</p>
                  <p className="text-white font-semibold">{longestMin} min</p>
                </div>
                <div>
                  <p className="text-[#8E8E93] text-xs">Distractions</p>
                  <p className="text-white font-semibold">{metrics.distraction_count}</p>
                </div>
              </div>
            </div>
          )}

          {website_activity.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#FF841C]" /> Websites During Session
              </h2>
              <div className="space-y-2">
                {website_activity.slice(0, 10).map((w) => (
                  <div key={w.domain} className="flex items-center justify-between gap-3 py-2 border-b border-[#2E2E32] last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{w.domain}</p>
                      {w.sample_title && <p className="text-[#8E8E93] text-xs truncate">{w.sample_title}</p>}
                    </div>
                    <span className="text-[#8E8E93] text-xs flex-shrink-0">{fmt(w.seconds)}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                      w.status === 'distracting' ? 'bg-[#2D1616] text-[#EF4444]' : 'bg-[#0F2922] text-[#10B981]'
                    }`}>
                      {w.status === 'distracting' ? 'Distracting' : 'Relevant'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {distraction_events.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#EF4444]" /> Distraction Events
              </h2>
              <div className="space-y-3">
                {distraction_events.slice(0, 10).map((d, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-[#2E2E32] last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">{d.domain}</p>
                      {d.page_title && <p className="text-[#8E8E93] text-xs truncate">{d.page_title}</p>}
                      {d.reason && <p className="text-[#D1D5DB] text-xs italic mt-0.5">{d.reason}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white text-xs font-semibold">{fmt(d.seconds)}</p>
                      {d.recorded_at && (
                        <p className="text-[#8E8E93] text-[10px]">
                          {new Date(d.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blocked_attempts.length > 0 && (
            <div className="bg-[#261A10] border border-[#FF841C]/35 rounded-[18px] p-6 mb-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={16} className="text-[#FF841C]" /> Blocked Attempts ({blocked_attempts.length})
              </h2>
              <div className="space-y-2">
                {blocked_attempts.map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5">
                    <span className="text-white font-medium">{b.domain}</span>
                    {b.recorded_at && (
                      <span className="text-[#8E8E93] text-xs">
                        {new Date(b.recorded_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai_insights && (
            <div className="bg-gradient-to-br from-[#2B1D12] via-[#1F1711] to-[#1A1A1A] border border-[#FF841C]/35 rounded-[18px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={18} className="text-[#FF841C]" />
                <h2 className="text-sm font-bold text-white">DayDive&apos;s Take</h2>
              </div>
              <div className="text-[#D1D5DB] text-sm leading-relaxed whitespace-pre-wrap">
                {ai_insights}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}