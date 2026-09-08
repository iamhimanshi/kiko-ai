import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import MetricCard from '../components/MetricCard'
import { useAuth } from '../context/AuthContext'
import * as sessionsApi from '../services/sessionsApi'

function formatDuration(totalSeconds) {
  const m = Math.round(totalSeconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await sessionsApi.getDashboardSummary()
      setSummary(data)
    } catch {
      setError('Could not load your study activity.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-h2 text-ink">Good {timeOfDayGreeting()}.</h1>
          <p className="text-muted mt-1">Ready to focus, {user?.name?.split(' ')[0]}?</p>
        </div>
        <button
          onClick={() => navigate('/session/new')}
          className="flex items-center gap-2 bg-brand text-white font-medium px-5 py-2.5 rounded hover:bg-brand-dark transition"
        >
          <Plus size={16} /> Start Study Session
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="text-center py-16 border border-border rounded-lg">
          <p className="text-sm text-danger mb-4">{error}</p>
          <button onClick={load} className="text-sm text-brand-light hover:underline">Try Again</button>
        </div>
      ) : summary.today_session_count === 0 ? (
        <EmptyDashboard onStart={() => navigate('/session/new')} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <MetricCard label="Study Time" value={formatDuration(summary.today_study_seconds)} />
            <MetricCard label="Focus Score" value={`${summary.today_focus_score}%`} prominent />
            <MetricCard label="Distracted" value={formatDuration(summary.today_distracted_seconds)} />
            <MetricCard label="Sessions" value={summary.today_session_count} />
          </div>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-sm font-medium text-ink mb-4">Recent Study Sessions</h2>
              <div className="space-y-1">
                {summary.recent_sessions.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => navigate(`/session/${s.session_id}/report`)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded hover:bg-cardElevated transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{s.subject}</p>
                      <p className="text-xs text-subtle truncate">{s.goal}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-muted">{formatDuration(s.duration_seconds)}</span>
                      <span className="text-xs font-medium text-focus">{s.focus_score}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-sm font-medium text-ink mb-4 self-start">Focus Overview</h2>
              <p className="font-display text-4xl text-brand-light font-semibold">{summary.today_focus_score}%</p>
              <p className="text-xs text-subtle mb-4">Focus today</p>
              <div className="w-full space-y-2">
                <BarRow label="Focused" seconds={summary.today_study_seconds - summary.today_distracted_seconds} color="bg-focus" />
                <BarRow label="Distracted" seconds={summary.today_distracted_seconds} color="bg-distract" />
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}

function BarRow({ label, seconds, color }) {
  return (
    <div className="text-left">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        <span>{formatDuration(Math.max(0, seconds))}</span>
      </div>
      <div className="h-1.5 rounded-full bg-cardElevated overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: seconds > 0 ? '100%' : '0%' }} />
      </div>
    </div>
  )
}

function EmptyDashboard({ onStart }) {
  return (
    <div className="text-center py-20 border border-border rounded-lg">
      <Sparkles size={26} className="text-brand-light mx-auto mb-4" />
      <p className="text-ink font-medium mb-1">You haven't started studying yet.</p>
      <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
        Start your first focused session and let KIKO track your progress.
      </p>
      <button
        onClick={onStart}
        className="bg-brand text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-brand-dark transition"
      >
        Start Study Session
      </button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-6 h-24 animate-pulse" />
      ))}
    </div>
  )
}

function timeOfDayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
