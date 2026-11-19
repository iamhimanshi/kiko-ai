import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sessionApi } from '../services/api';
import {
  Play, Pause, Square, CheckCircle, Circle,
  Target, Activity, AlertTriangle, Coffee, Zap,
} from 'lucide-react';

const getActiveElapsedSec = (session, nowMs = Date.now()) => {
  if (!session?.started_at) return 0;
  const startMs = new Date(session.started_at).getTime();
  const realElapsed = Math.floor((nowMs - startMs) / 1000);
  let pausedSec = session.paused_duration_seconds || 0;
  if (session.status === 'PAUSED' && session.paused_at) {
    pausedSec += Math.floor((nowMs - new Date(session.paused_at).getTime()) / 1000);
  }
  return Math.max(realElapsed - pausedSec, 0);
};

const computePomodoroPhase = (activeElapsedSec, workMin, breakMin) => {
  const workSec = Math.max(workMin, 1) * 60;
  const breakSec = Math.max(breakMin, 1) * 60;
  const cycleSec = workSec + breakSec;
  const inCycle = activeElapsedSec % cycleSec;
  const completedCycles = Math.floor(activeElapsedSec / cycleSec);
  if (inCycle < workSec) {
    return { phase: 'work', remaining: workSec - inCycle, phaseTotal: workSec, completedCycles };
  }
  return { phase: 'break', remaining: cycleSec - inCycle, phaseTotal: breakSec, completedCycles };
};

function TactileDialTimer({
  minutesStr, secondsStr, progress, totalDots = 5, filledDots = 1,
  isPaused = false, isBreak = false, phaseLabel = 'Focus Time',
  subLabel = '', onTogglePause, onOpenEndModal,
}) {
  const size = 276;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference * (1 - clamped);
  const angleRad = (clamped * 360 - 90) * (Math.PI / 180);
  const knobX = cx + radius * Math.cos(angleRad);
  const knobY = cy + radius * Math.sin(angleRad);
  const ticks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className="bg-[#1A1A1A] rounded-[28px] p-7 sm:p-9 text-white border border-[#2E2E32] shadow-[0px_18px_45px_rgba(0,0,0,0.55)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,132,28,0.12),transparent_65%)] pointer-events-none" />

      <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            <linearGradient id="daydiveRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isBreak ? '#10B981' : '#FDBA74'} />
              <stop offset="50%" stopColor={isBreak ? '#34D399' : '#FF841C'} />
              <stop offset="100%" stopColor={isBreak ? '#059669' : '#E66A10'} />
            </linearGradient>
            <filter id="daydiveGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {ticks.map((t) => {
            const deg = t * 6;
            const isMajor = t % 5 === 0;
            const r1 = radius + 14;
            const r2 = radius + (isMajor ? 22 : 18);
            const rad = ((deg - 90) * Math.PI) / 180;
            return (
              <line
                key={t}
                x1={cx + r1 * Math.cos(rad)}
                y1={cy + r1 * Math.sin(rad)}
                x2={cx + r2 * Math.cos(rad)}
                y2={cy + r2 * Math.sin(rad)}
                stroke={isMajor ? '#8E8E93' : '#48484A'}
                strokeOpacity={isMajor ? 0.7 : 0.4}
                strokeWidth={isMajor ? 1.6 : 1}
                strokeLinecap="round"
              />
            );
          })}

          <circle cx={cx} cy={cy} r={radius - 10} fill="#121212" stroke="#2E2E32" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#232325" strokeWidth="5" />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#daydiveRingGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            filter="url(#daydiveGlow)"
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
          {clamped > 0.01 && (
            <circle
              cx={knobX}
              cy={knobY}
              r="5.5"
              fill={isBreak ? '#10B981' : '#FF841C'}
              stroke="#FFFFFF"
              strokeWidth="2"
              filter="url(#daydiveGlow)"
              style={{ transition: 'cx 0.5s linear, cy 0.5s linear' }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[52px] font-extrabold tracking-tight leading-none tabular-nums flex items-center">
            <span>{minutesStr}</span>
            <span className={`${isBreak ? 'text-[#10B981]' : 'text-[#FF841C]'} mx-0.5`}>:</span>
            <span>{secondsStr}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-3.5">
            {Array.from({ length: totalDots }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < filledDots
                    ? isBreak ? 'bg-[#10B981]' : 'bg-[#FF841C]'
                    : 'border border-[#8E8E93]/40 bg-transparent'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-medium uppercase tracking-widest text-[#8E8E93] mt-2">
            {isPaused ? 'Paused' : phaseLabel}
          </span>
        </div>
      </div>

      {subLabel && <p className="text-xs text-[#8E8E93] text-center mt-1 mb-5">{subLabel}</p>}

      <div className="flex items-center justify-center gap-3.5 mt-5 relative z-10">
        <button
          type="button"
          onClick={onTogglePause}
          className="flex-1 max-w-[210px] py-3.5 px-6 rounded-full font-bold text-sm tracking-wider uppercase text-[#121212] bg-gradient-to-r from-[#FF841C] to-[#E66A10] hover:from-[#FF963E] hover:to-[#FF841C] shadow-[0px_8px_22px_rgba(230,106,16,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isPaused ? <><Play size={16} fill="currentColor" /> Resume Timer</> : <><Pause size={16} fill="currentColor" /> Pause Timer</>}
        </button>

        <button
          type="button"
          onClick={onOpenEndModal}
          title="End Session"
          aria-label="End Session"
          className="w-12 h-12 rounded-full bg-[#232325] hover:bg-[#E66A10] text-[#8E8E93] hover:text-white border border-[#2E2E32] flex items-center justify-center transition-all"
        >
          <Square size={16} fill="currentColor" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3 text-[11px] text-[#8E8E93] font-medium tracking-wider uppercase">
        <span className="inline-flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 rounded bg-[#121212] border border-[#2E2E32] text-white font-mono text-[10px]">SPACE</kbd>
          {isPaused ? 'Resume' : 'Pause'}
        </span>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session?.status, session?.paused_duration_seconds]);

  const handlePauseResume = useCallback(async () => {
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
  }, [session]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || showEndConfirm) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
      e.preventDefault();
      handlePauseResume();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePauseResume, showEndConfirm]);

  const totalSec = Math.max((session?.duration_minutes || 0) * 60, 1);
  const activeElapsedSec = useMemo(() => getActiveElapsedSec(session, now), [session, now]);
  const totalRemaining = Math.max(totalSec - activeElapsedSec, 0);

  const isPomodoro = session?.mode === 'pomodoro';
  let displaySeconds = totalRemaining;
  let phase = null;
  let phaseLabel = 'Focus Time';
  let ringProgress = totalRemaining / totalSec;
  let totalDots = 5;
  let filledDots = Math.max(1, Math.min(5, Math.ceil((activeElapsedSec / totalSec) * 5)));

  if (isPomodoro && session) {
    const p = computePomodoroPhase(
      activeElapsedSec,
      session.work_duration_minutes || 25,
      session.break_duration_minutes || 5
    );
    phase = p.phase;
    displaySeconds = p.remaining;
    ringProgress = p.remaining / p.phaseTotal;
    phaseLabel = phase === 'work' ? 'Focus Sprint' : 'Break Time';
    const workSec = Math.max(session.work_duration_minutes || 25, 1) * 60;
    const breakSec = Math.max(session.break_duration_minutes || 5, 1) * 60;
    totalDots = Math.max(1, Math.min(6, Math.round(totalSec / (workSec + breakSec))));
    filledDots = Math.min(totalDots, p.completedCycles + 1);
  }

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
    if (!session || session.status === 'COMPLETED' || session.status === 'ABANDONED') return;
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

  const minutesStr = String(Math.floor(displaySeconds / 60)).padStart(2, '0');
  const secondsStr = String(displaySeconds % 60).padStart(2, '0');

  const getStatusConfig = () => {
    if (session.status === 'PAUSED') {
      return { label: 'Paused', color: '#FF841C', bg: '#261A10', border: '#FF841C40', dot: 'bg-[#FF841C]' };
    }
    if (isPomodoro && phase === 'break') {
      return { label: 'On Break', color: '#10B981', bg: '#0F2922', border: '#10B98140', dot: 'bg-[#10B981]' };
    }
    return { label: 'Focused', color: '#10B981', bg: '#0F2922', border: '#10B98140', dot: 'bg-[#10B981]' };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#8E8E93] font-medium">Loading session...</div>
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="flex min-h-screen bg-[#121212] text-white">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="card p-8 max-w-md text-center">
            <AlertTriangle className="text-[#FF841C] mx-auto mb-3" size={40} />
            <p className="text-white font-semibold mb-4">{error}</p>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const cfg = getStatusConfig();

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="bg-[#2D1616] border border-[#EF4444]/40 text-[#EF4444] px-4 py-3 rounded-[14px] mb-5 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="card p-5 mb-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#FF841C] text-xs font-bold uppercase tracking-wider mb-1">
                <Target size={14} />
                <span>{session.subject}</span>
              </div>
              <p className="text-white text-sm font-semibold truncate max-w-md">{session.goal}</p>
            </div>

            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border"
              style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
            >
              {isPomodoro && phase === 'work' && <Zap size={12} className="text-[#FF841C]" />}
              {isPomodoro && phase === 'break' && <Coffee size={12} className="text-[#10B981]" />}
              <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
              <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>

          <TactileDialTimer
            minutesStr={minutesStr}
            secondsStr={secondsStr}
            progress={ringProgress}
            totalDots={totalDots}
            filledDots={filledDots}
            isPaused={session.status === 'PAUSED'}
            isBreak={isPomodoro && phase === 'break'}
            phaseLabel={phaseLabel}
            subLabel={
              isPomodoro
                ? `${Math.ceil(totalRemaining / 60)} min total session remaining`
                : `${Math.floor(activeElapsedSec / 60)} min elapsed`
            }
            onTogglePause={handlePauseResume}
            onOpenEndModal={() => setShowEndConfirm(true)}
          />

          {session.tasks && session.tasks.length > 0 && (
            <div className="card p-6 mt-5">
              <div className="flex items-center justify-between mb-3.5">
                <p className="text-white text-xs uppercase tracking-wider font-bold">Session Tasks</p>
                <span className="text-[#FF841C] bg-[#261A10] border border-[#FF841C]/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {session.completed_tasks}/{session.total_tasks} done
                </span>
              </div>
              <div className="space-y-2.5">
                {session.tasks.map((task) => {
                  const isToggling = togglingTaskId === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      disabled={session.status !== 'ACTIVE' && session.status !== 'PAUSED'}
                      className={`flex items-center gap-3 w-full text-left p-3 rounded-[12px] bg-[#232325] hover:border-[#FF841C]/50 border border-[#2E2E32] group disabled:cursor-not-allowed transition ${
                        isToggling ? 'opacity-50' : ''
                      }`}
                    >
                      {task.is_completed ? (
                        <CheckCircle size={18} className="text-[#10B981] flex-shrink-0" />
                      ) : (
                        <Circle size={18} className="text-[#8E8E93] flex-shrink-0 group-hover:text-[#FF841C] transition" />
                      )}
                      <span className={`text-sm font-medium transition ${task.is_completed ? 'text-[#8E8E93] line-through' : 'text-white'}`}>
                        {task.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-4 text-[#8E8E93] text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Activity size={14} className="text-[#10B981]" />
              <span>MindGuard Active</span>
            </div>
            <span className="w-1 h-1 bg-[#2E2E32] rounded-full"></span>
            <span>Chrome Extension Connected</span>
          </div>
        </div>
      </main>

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] rounded-[20px] shadow-2xl border border-[#2E2E32] p-8 max-w-md w-full">
            <h3 className="text-xl font-extrabold text-white mb-2">End this study session?</h3>
            <p className="text-[#8E8E93] text-sm mb-6">
              You&apos;ve studied for <span className="font-bold text-white">{Math.floor(activeElapsedSec / 60)} minutes</span>.
            </p>
            <div className="bg-[#232325] border border-[#2E2E32] rounded-[14px] p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E93]">Planned duration</span>
                <span className="text-white font-semibold">{session.duration_minutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8E8E93]">Tasks completed</span>
                <span className="text-white font-semibold">{session.completed_tasks} / {session.total_tasks}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowEndConfirm(false)} className="flex-1 btn-secondary py-3">
                Keep Studying
              </button>
              <button type="button" onClick={handleEnd} disabled={ending} className="flex-1 btn-primary py-3 disabled:opacity-50">
                {ending ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
