import { useState, useEffect, useMemo } from 'react';
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
  Coffee,
  Zap,
} from 'lucide-react';

const getActiveElapsedSec = (session, nowMs = Date.now()) => {
  if (!session?.started_at) return 0;
  const startMs = new Date(session.started_at).getTime();
  const realElapsed = Math.floor((nowMs - startMs) / 1000);
  let pausedSec = session.paused_duration_seconds || 0;
  if (session.status === 'PAUSED' && session.paused_at) {
    pausedSec += Math.floor(
      (nowMs - new Date(session.paused_at).getTime()) / 1000
    );
  }
  return Math.max(realElapsed - pausedSec, 0);
};

const computePomodoroPhase = (activeElapsedSec, workMin, breakMin) => {
  const workSec = Math.max(workMin, 1) * 60;
  const breakSec = Math.max(breakMin, 1) * 60;
  const cycleSec = workSec + breakSec;
  const inCycle = activeElapsedSec % cycleSec;
  if (inCycle < workSec) {
    return { phase: 'work', remaining: workSec - inCycle };
  }
  return { phase: 'break', remaining: cycleSec - inCycle };
};

export default function ActiveSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState(null);

  // Load session
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

  // Tick only when ACTIVE
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session?.status, session?.paused_duration_seconds]);

  const totalSec = (session?.duration_minutes || 0) * 60;
  const activeElapsedSec = useMemo(
    () => getActiveElapsedSec(session, now),
    [session, now]
  );
  const totalRemaining = Math.max(totalSec - activeElapsedSec, 0);

  const isPomodoro = session?.mode === 'pomodoro';
  let displaySeconds = totalRemaining;
  let phase = null;
  let phaseLabel = 'Remaining';
  if (isPomodoro && session) {
    const p = computePomodoroPhase(
      activeElapsedSec,
      session.work_duration_minutes || 25,
      session.break_duration_minutes || 5
    );
    phase = p.phase;
    displaySeconds = p.remaining;
    phaseLabel = phase === 'work' ? 'Focus session' : 'Break';
  }

  const handlePauseResume = async () => {
    if (!session) return;
    try {
      const response =
        session.status === 'ACTIVE'
          ? await sessionApi.pause(session.id)
          : await sessionApi.resume(session.id);
      setSession(response.data);
      setNow(Date.now());
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
    setTogglingTaskId(taskId);
    try {
      await sessionApi.toggleTask(session.id, taskId);
      const response = await sessionApi.getById(session.id);
      setSession(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update task');
    } finally {
      setTogglingTaskId(null);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusConfig = () => {
    if (session.status === 'PAUSED') {
      return { label: 'Paused', color: '#D97706', bg: '#FFF6E4', dot: 'bg-[#D97706]' };
    }
    if (isPomodoro && phase === 'break') {
      return { label: 'On Break', color: '#D4A64A', bg: '#FFF8E8', dot: 'bg-[#D4A64A]' };
    }
    return { label: 'Focused', color: '#2E7D32', bg: '#EAF8EC', dot: 'bg-[#2E7D32]' };
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

  const cfg = getStatusConfig();

  return (
    <div className="flex min-h-screen bg-[#F8F7F2]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="bg-[#FDECEC] border border-[#D14343]/30 text-[#D14343] px-4 py-3 rounded-[14px] mb-5 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-[18px] shadow-[0px_4px_12px_rgba(16,24,40,0.06)] border border-[#E8ECE7]/30 p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[#6B7280] text-sm mb-1">
              <Target size={14} />
              <span>{session.subject}</span>
            </div>
            <p className="text-[#4B5563] text-sm mb-6 max-w-md mx-auto">
              {session.goal}
            </p>

            {/* Timer */}
            <div className="text-7xl font-mono font-bold text-[#1F2937] mb-2 tracking-tight">
              {formatTime(displaySeconds)}
            </div>

            {/* Phase / remaining label */}
            <div className="flex items-center justify-center gap-2 text-[#9CA3AF] text-xs mb-4">
              {isPomodoro && phase === 'work' && <Zap size={12} />}
              {isPomodoro && phase === 'break' && <Coffee size={12} />}
              <span>{phaseLabel}</span>
              {isPomodoro && (
                <>
                  <span className="w-1 h-1 bg-[#E8ECE7] rounded-full"></span>
                  <span>{Math.ceil(totalRemaining / 60)} min total left</span>
                </>
              )}
            </div>

            {/* Status pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: cfg.bg }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />
              <span className="text-sm font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#EDF4EE] rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-[#1B4332] rounded-full transition-all"
                style={{
                  width: `${(totalRemaining / totalSec) * 100}%`,
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
                  {session.tasks.map((task) => {
                    const isToggling = togglingTaskId === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        disabled={
                          session.status !== 'ACTIVE' &&
                          session.status !== 'PAUSED'
                        }
                        className={`flex items-center gap-3 w-full text-left group disabled:cursor-not-allowed transition ${
                          isToggling ? 'opacity-50' : ''
                        }`}
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
                    );
                  })}
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

      {/* End confirm modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[18px] shadow-2xl border border-[#E8ECE7]/30 p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">
              End this study session?
            </h3>
            <p className="text-[#4B5563] text-sm mb-6">
              You've studied for{' '}
              <span className="font-semibold text-[#1F2937]">
                {Math.floor(activeElapsedSec / 60)} minutes
              </span>
              .
            </p>
            <div className="bg-[#F8F7F2] rounded-[14px] p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Planned duration</span>
                <span className="text-[#1F2937] font-medium">
                  {session.duration_minutes} min
                </span>
              </div>
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
                Keep Studying
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
