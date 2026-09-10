import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  PlayCircle,
  PauseCircle,
  StopCircle,
  CheckCircle,
  Circle,
  Target,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export default function ActiveSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const intervalRef = useRef(null);

  // Fetch session
  useEffect(() => {
    const load = async () => {
      try {
        const response = await sessionApi.getById(sessionId);
        setSession(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Session not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  // Compute remaining time
  const computeRemaining = (sess) => {
    if (!sess || !sess.started_at) return 0;

    const startMs = new Date(sess.started_at).getTime();
    const nowMs = Date.now();
    const realElapsedSec = Math.floor((nowMs - startMs) / 1000);

    let pausedSec = sess.paused_duration_seconds || 0;
    if (sess.status === 'PAUSED' && sess.paused_at) {
      pausedSec += Math.floor(
        (nowMs - new Date(sess.paused_at).getTime()) / 1000
      );
    }

    const activeElapsedSec = Math.max(realElapsedSec - pausedSec, 0);
    const totalSec = sess.duration_minutes * 60;
    return Math.max(totalSec - activeElapsedSec, 0);
  };

  // Tick every second when active
  useEffect(() => {
    if (!session) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    // Initial compute
    setRemainingSeconds(computeRemaining(session));

    if (session.status === 'ACTIVE') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const next = prev - 1;
          return next > 0 ? next : 0;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session]);

  const handlePauseResume = async () => {
    if (!session) return;
    try {
      const response =
        session.status === 'ACTIVE'
          ? await sessionApi.pause(session.id)
          : await sessionApi.resume(session.id);
      setSession(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleEnd = async () => {
    if (!session) return;
    setEnding(true);
    try {
      await sessionApi.end(session.id);
      navigate(`/study-session/complete/${session.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not end session');
      setEnding(false);
      setShowEndConfirm(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    if (!session) return;
    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') return;
    try {
      await sessionApi.toggleTask(session.id, taskId);
      // Refetch to get updated tasks
      const response = await sessionApi.getById(session.id);
      setSession(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update task');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const statusConfig = {
    ACTIVE: {
      label: 'Focused',
      color: '#2E7D32',
      bg: '#EAF8EC',
      dot: 'bg-[#2E7D32]',
      icon: Activity,
    },
    PAUSED: {
      label: 'Paused',
      color: '#D97706',
      bg: '#FFF6E4',
      dot: 'bg-[#D97706]',
      icon: PauseCircle,
    },
    COMPLETED: {
      label: 'Completed',
      color: '#6B7280',
      bg: '#F3F4F6',
      dot: 'bg-[#6B7280]',
      icon: CheckCircle,
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#6B7280]">Loading session...</div>
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex min-h-screen bg-[#F8F7F2]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 max-w-md text-center">
            <AlertTriangle className="text-[#D14343] mx-auto mb-3" size={40} />
            <p className="text-[#1F2937] font-medium mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#1B4332] hover:bg-[#24543F] text-white px-6 py-2.5 rounded-[14px] font-medium transition"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const cfg = statusConfig[session.status] || statusConfig.ACTIVE;
  const StatusIcon = cfg.icon;

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Error banner */}
          {error && (
            <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-5 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-center">
            {/* Subject + Goal */}
            <div className="flex items-center justify-center gap-2 text-[#6B7280] text-sm mb-1">
              <Target size={14} />
              <span>{session.subject}</span>
            </div>
            <p className="text-[#4B5563] text-sm mb-6 max-w-md mx-auto">
              {session.goal}
            </p>

            {/* Timer */}
            <div className="text-7xl font-mono font-bold text-[#1F2937] mb-4 tracking-tight">
              {formatTime(remainingSeconds)}
            </div>

            {/* Focus status */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: cfg.bg }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
              <span
                className="text-sm font-medium"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#EDF4EE] rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-[#1B4332] rounded-full transition-all"
                style={{
                  width: `${
                    (remainingSeconds / (session.duration_minutes * 60)) * 100
                  }%`,
                }}
              />
            </div>

            {/* Tasks */}
            {session.tasks && session.tasks.length > 0 && (
              <div className="bg-[#F8F7F2] rounded-[14px] p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[#6B7280] text-xs uppercase tracking-wider font-medium">
                    Tasks
                  </p>
                  <p className="text-[#6B7280] text-xs">
                    {session.completed_tasks}/{session.total_tasks} done
                  </p>
                </div>
                <div className="space-y-2">
                  {session.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      disabled={session.status !== 'ACTIVE' && session.status !== 'PAUSED'}
                      className="flex items-center gap-3 w-full text-left group disabled:cursor-not-allowed"
                    >
                      {task.is_completed ? (
                        <CheckCircle
                          size={18}
                          className="text-[#2E7D32] flex-shrink-0"
                        />
                      ) : (
                        <Circle
                          size={18}
                          className="text-[#9CA3AF] flex-shrink-0 group-hover:text-[#1B4332] transition"
                        />
                      )}
                      <span
                        className={`text-sm transition ${
                          task.is_completed
                            ? 'text-[#9CA3AF] line-through'
                            : 'text-[#4B5563] group-hover:text-[#1B2932]'
                        }`}
                      >
                        {task.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePauseResume}
                className="bg-white border border-[#E8ECE7] hover:bg-[#EDF4EE] text-[#1B4332] px-6 py-3 rounded-[14px] font-medium transition flex items-center gap-2"
              >
                {session.status === 'ACTIVE' ? (
                  <>
                    <PauseCircle size={18} />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} />
                    Resume
                  </>
                )}
              </button>

              <button
                onClick={() => setShowEndConfirm(true)}
                className="bg-[#D14343] hover:bg-[#B93535] text-white px-6 py-3 rounded-[14px] font-medium transition flex items-center gap-2"
              >
                <StopCircle size={18} />
                End Session
              </button>
            </div>
          </div>

          {/* MindGuard placeholder */}
          <div className="mt-4 flex items-center justify-center gap-4 text-[#6B7280] text-xs">
            <div className="flex items-center gap-1.5">
              <Activity size={14} className="text-[#2E7D32]" />
              <span>MindGuard Active</span>
            </div>
            <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
            <span>Chrome Extension Connected</span>
          </div>
        </div>
      </main>

      {/* End Session Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[18px] shadow-2xl border border-[#E8ECE7]/30 p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">
              End this study session?
            </h3>
            <p className="text-[#4B5563] text-sm mb-6">
              You've studied for{' '}
              <span className="font-semibold text-[#1F2937]">
                {session.duration_minutes -
                  Math.floor(remainingSeconds / 60)}{' '}
                minutes
              </span>
              .
            </p>

            <div className="bg-[#F8F7F2] rounded-[14px] p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Tasks completed</span>
                <span className="text-[#1F2937] font-medium">
                  {session.completed_tasks} / {session.total_tasks}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-white border border-[#E8ECE7] hover:bg-[#EDF4EE] text-[#4B5563] py-3 rounded-[14px] font-medium transition"
              >
                Continue Studying
              </button>
              <button
                onClick={handleEnd}
                disabled={ending}
                className="flex-1 bg-[#D14343] hover:bg-[#B93535] text-white py-3 rounded-[14px] font-medium transition disabled:opacity-50"
              >
                {ending ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}