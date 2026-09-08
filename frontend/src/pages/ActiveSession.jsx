import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, Circle } from 'lucide-react'
import FocusStatus from '../components/FocusStatus'
import * as sessionsApi from '../services/sessionsApi'

const POLL_INTERVAL_MS = 5000

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ActiveSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [live, setLive] = useState(null)
  const [tasks, setTasks] = useState([])
  const [dismissedWarningKey, setDismissedWarningKey] = useState(null)
  const [error, setError] = useState('')
  const [showEndModal, setShowEndModal] = useState(false)
  const [ending, setEnding] = useState(false)
  const pollRef = useRef(null)

  const fetchLive = useCallback(async () => {
    try {
      const data = await sessionsApi.getLiveStatus(sessionId)
      setLive(data)
    } catch {
      // transient network hiccups shouldn't blow up the live view
    }
  }, [sessionId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const s = await sessionsApi.getSession(sessionId)
        if (cancelled) return
        if (s.status === 'completed') {
          navigate(`/session/${sessionId}/report`, { replace: true })
          return
        }
        setSession(s)
        setTasks(s.tasks || [])
      } catch {
        setError('Could not load this session.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId, navigate])

  useEffect(() => {
    fetchLive()
    pollRef.current = setInterval(fetchLive, POLL_INTERVAL_MS)
    return () => clearInterval(pollRef.current)
  }, [fetchLive])

  function toggleTask(index) {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)))
  }

  async function handleEnd(goalCompleted) {
    setEnding(true)
    try {
      await sessionsApi.endSession(sessionId, goalCompleted)
      navigate(`/session/${sessionId}/report`, { replace: true })
    } catch {
      setError('Could not end the session. Try again.')
      setEnding(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center px-6">
        <p className="text-danger text-sm">{error}</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <p className="text-muted text-sm">Preparing your study session…</p>
      </div>
    )
  }

  const elapsed = live?.elapsed_seconds ?? 0
  const plannedSeconds = session.planned_duration_seconds
  const progressPct = Math.min(100, (elapsed / plannedSeconds) * 100)
  const status = live?.status ?? 'monitoring'

  const warning = live?.active_warning
  const warningKey = warning ? `${warning.domain}-${warning.page_title}` : null
  const showWarning = warning && warningKey !== dismissedWarningKey

  return (
    <div className="min-h-screen bg-base flex flex-col items-center px-6 py-10 relative">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-10">
          <span className="font-display text-sm font-semibold text-ink">KIKO AI</span>
          <FocusStatus status={status === 'monitoring' ? 'monitoring' : status} />
        </div>

        <div className="text-center mb-8">
          <p className="text-xs text-subtle tracking-widest uppercase mb-1">{session.goal}</p>
          <p className="text-sm text-muted">{session.subject}</p>
        </div>

        <p className="font-display text-[56px] leading-none text-ink text-center mb-6 tabular-nums">
          {formatTime(elapsed)}
        </p>

        <div className="flex justify-center mb-8">
          <FocusStatus status={status} large />
        </div>

        <div className="mb-10">
          <div className="h-2 rounded-full bg-cardElevated overflow-hidden">
            <div
              className="h-full bg-focus transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-subtle mt-1.5 text-right">
            {Math.round(progressPct)}% of {Math.round(plannedSeconds / 60)} min
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="mb-10">
            <p className="text-xs text-subtle uppercase tracking-wide mb-3">Tasks</p>
            <ul className="space-y-2">
              {tasks.map((t, i) => (
                <li key={i}>
                  <button
                    onClick={() => toggleTask(i)}
                    className="flex items-center gap-3 text-sm text-left w-full group"
                  >
                    {t.done ? (
                      <Check size={16} className="text-focus shrink-0" />
                    ) : (
                      <Circle size={16} className="text-subtle shrink-0" />
                    )}
                    <span className={t.done ? 'text-subtle line-through' : 'text-ink'}>{t.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center border-t border-border pt-8">
          <button
            onClick={() => setShowEndModal(true)}
            className="text-sm border border-border text-muted hover:text-ink hover:border-danger px-6 py-2.5 rounded transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {showWarning && (
        <DistractionWarning
          warning={warning}
          onReturn={() => setDismissedWarningKey(warningKey)}
          onBreak={() => setDismissedWarningKey(warningKey)}
        />
      )}

      {showEndModal && (
        <EndSessionModal
          submitting={ending}
          onClose={() => setShowEndModal(false)}
          onConfirm={handleEnd}
        />
      )}
    </div>
  )
}

function DistractionWarning({ warning, onReturn, onBreak }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base/80 px-6" role="alertdialog" aria-live="assertive">
      <div className="bg-card border border-distract/40 rounded-modal p-8 max-w-sm w-full text-center shadow-card">
        <AlertTriangle size={28} className="text-distract mx-auto mb-4" />
        <p className="text-ink font-medium mb-6 leading-relaxed">
          This doesn't look related to your current study goal.
        </p>

        <div className="text-left bg-cardElevated rounded p-4 mb-6 space-y-2">
          <div>
            <p className="text-[11px] text-subtle uppercase tracking-wide">Goal</p>
            <p className="text-sm text-ink">{warning.goal}</p>
          </div>
          <div>
            <p className="text-[11px] text-subtle uppercase tracking-wide">Current activity</p>
            <p className="text-sm text-ink">{warning.page_title || warning.domain}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReturn}
            className="flex-1 bg-brand text-white text-sm font-medium py-2.5 rounded hover:bg-brand-dark transition"
          >
            Return to Study
          </button>
          <button
            onClick={onBreak}
            className="flex-1 border border-border text-muted text-sm py-2.5 rounded hover:text-ink transition-colors"
          >
            Take Break
          </button>
        </div>
      </div>
    </div>
  )
}

function EndSessionModal({ submitting, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-base/80 px-6">
      <div className="bg-card border border-border rounded-modal p-8 max-w-sm w-full shadow-card">
        <h3 className="font-display text-h4 text-ink mb-2">End this session?</h3>
        <p className="text-sm text-muted mb-6">Did you complete your study goal?</p>
        <div className="flex flex-col gap-2.5">
          <button
            disabled={submitting}
            onClick={() => onConfirm(true)}
            className="bg-brand text-white text-sm font-medium py-2.5 rounded hover:bg-brand-dark transition disabled:opacity-60"
          >
            Yes, goal completed
          </button>
          <button
            disabled={submitting}
            onClick={() => onConfirm(false)}
            className="border border-border text-ink text-sm py-2.5 rounded hover:border-brand-light transition disabled:opacity-60"
          >
            Not completed
          </button>
          <button
            disabled={submitting}
            onClick={onClose}
            className="text-subtle text-xs py-1.5 hover:text-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
