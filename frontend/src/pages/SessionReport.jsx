import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Target, Zap } from 'lucide-react';

export default function SessionReport() {
  const navigate = useNavigate();

  // This will be replaced with real data
  const report = {
    subject: 'DSA — Linked Lists',
    duration: '60 min',
    focusScore: 84,
    focusedTime: '50 min',
    distractionTime: '10 min',
    longestFocus: '32 min',
    websites: [
      { name: 'youtube.com', time: '22m', status: 'Relevant' },
      { name: 'leetcode.com', time: '18m', status: 'Relevant' },
      { name: 'instagram.com', time: '4m', status: 'Distracting' },
      { name: 'google.com', time: '8m', status: 'Mixed' },
    ],
    distractions: [
      { time: '10:24', site: 'Instagram' },
      { time: '11:02', site: 'Entertainment YouTube' },
      { time: '11:18', site: 'Instagram' },
    ],
    insight: 'You maintained strong focus during the first 32 minutes of your session. Most distractions occurred after the 40-minute mark. Try a short break around the 40-minute point in your next session.',
  };

  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">{report.subject}</h1>
          <p className="text-text-secondary text-sm mb-6">Session Report</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-elevated border border-border-default rounded-xl p-4 text-center">
              <div className="text-text-muted text-xs mb-1">Duration</div>
              <div className="text-xl font-bold text-text-primary">{report.duration}</div>
            </div>
            <div className="bg-bg-elevated border border-border-default rounded-xl p-4 text-center">
              <div className="text-text-muted text-xs mb-1">Focus Score</div>
              <div className="text-xl font-bold text-state-success">{report.focusScore}%</div>
            </div>
            <div className="bg-bg-elevated border border-border-default rounded-xl p-4 text-center">
              <div className="text-text-muted text-xs mb-1">Focused Time</div>
              <div className="text-xl font-bold text-text-primary">{report.focusedTime}</div>
            </div>
            <div className="bg-bg-elevated border border-border-default rounded-xl p-4 text-center">
              <div className="text-text-muted text-xs mb-1">Distraction Time</div>
              <div className="text-xl font-bold text-state-warning">{report.distractionTime}</div>
            </div>
          </div>

          {/* Longest Focus */}
          <div className="bg-bg-elevated border border-border-default rounded-xl p-4 mb-6">
            <div className="text-text-muted text-sm">Longest Uninterrupted Focus</div>
            <div className="text-2xl font-bold text-text-primary">{report.longestFocus}</div>
          </div>

          {/* Websites */}
          <div className="mb-6">
            <h3 className="text-text-secondary text-sm font-medium mb-3">Website Activity</h3>
            <div className="bg-bg-elevated border border-border-default rounded-xl overflow-hidden">
              {report.websites.map((site, i) => (
                <div key={i} className={`flex justify-between items-center px-4 py-3 ${i < report.websites.length - 1 ? 'border-b border-border-default' : ''}`}>
                  <span className="text-text-primary">{site.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-text-muted text-sm">{site.time}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${site.status === 'Relevant' ? 'bg-state-successSubtle text-state-success' : site.status === 'Distracting' ? 'bg-state-errorSubtle text-state-error' : 'bg-state-warningSubtle text-state-warning'}`}>
                      {site.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distractions */}
          <div className="mb-6">
            <h3 className="text-text-secondary text-sm font-medium mb-3">Distraction Events</h3>
            <div className="bg-bg-elevated border border-border-default rounded-xl overflow-hidden">
              {report.distractions.map((dist, i) => (
                <div key={i} className={`flex justify-between items-center px-4 py-3 ${i < report.distractions.length - 1 ? 'border-b border-border-default' : ''}`}>
                  <span className="text-text-muted text-sm">{dist.time}</span>
                  <span className="text-state-error">{dist.site}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-accent-subtle border border-accent-primary/30 rounded-xl p-5">
            <div className="flex items-center gap-2 text-accent-primary font-medium mb-2">
              <span>🤖</span> KIKO's Insight
            </div>
            <p className="text-text-secondary text-sm">{report.insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

