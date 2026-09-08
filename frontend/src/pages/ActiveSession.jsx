import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Circle, StopCircle, Target, Zap, Activity } from 'lucide-react';

export default function ActiveSession() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isRunning, setIsRunning] = useState(true);
  const [focusState, setFocusState] = useState('focused');

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    // TODO: Call API to end session
    navigate('/study-session/report');
  };

  return (
    <div className="min-h-screen bg-bg-cream flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="card p-8 text-center">
          {/* Subject */}
          <div className="flex items-center justify-center gap-2 text-text-muted text-sm mb-6">
            <Target size={14} />
            <span>DSA — Linked Lists</span>
          </div>

          {/* Timer */}
          <div className="text-7xl font-mono font-bold text-text-dark mb-4 tracking-tight">
            {formatTime(timeLeft)}
          </div>

          {/* Focus Status */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${focusState === 'focused' ? 'bg-status-success' : 'bg-gold'}`} />
            <span className="text-text-slate text-sm font-medium">
              {focusState === 'focused' ? '🟢 Focused' : '🟡 Mild Distraction'}
            </span>
          </div>

          {/* Current Goal */}
          <div className="bg-bg-hover rounded-card p-4 mb-4 text-left">
            <p className="text-text-muted text-xs uppercase tracking-wider font-medium mb-1">Current Goal</p>
            <p className="text-text-dark font-medium">Study Linked Lists and solve 5 problems</p>
          </div>

          {/* Tasks */}
          <div className="bg-bg-hover rounded-card p-4 mb-8 text-left">
            <p className="text-text-muted text-xs uppercase tracking-wider font-medium mb-2">Tasks</p>
            <div className="space-y-1.5">
              {['Review linked list concepts', 'Watch tutorial', 'Solve 5 problems'].map((task, i) => (
                <div key={i} className="flex items-center gap-2 text-text-slate text-sm">
                  {i === 0 ? (
                    <CheckCircle size={16} className="text-status-success flex-shrink-0" />
                  ) : (
                    <Circle size={16} className="text-text-placeholder flex-shrink-0" />
                  )}
                  <span className={i === 0 ? 'line-through text-text-muted' : ''}>{task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* End Button */}
          <button
            onClick={handleEndSession}
            className="bg-status-error hover:bg-status-error/90 text-white px-8 py-3 rounded-button font-medium transition flex items-center justify-center gap-2 mx-auto"
          >
            <StopCircle size={18} />
            End Session
          </button>
        </div>

        {/* MindGuard Status */}
        <div className="mt-4 flex items-center justify-center gap-4 text-text-muted text-xs">
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-status-success" />
            <span>MindGuard Active</span>
          </div>
          <span className="w-1 h-1 bg-border rounded-full"></span>
          <span>Chrome Extension Connected</span>
        </div>
      </div>
    </div>
  );
}

