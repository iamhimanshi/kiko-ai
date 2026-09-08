import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import FocusRing from '../components/FocusRing'
import * as sessionsApi from '../services/sessionsApi'

function formatDuration(totalSeconds) {
  const m = Math.round(totalSeconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

export default function SessionReport() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let attempts = 0
    let cancelled = false

    async function load() {
      try {
        const data = await sessionsApi.getReport(sessionId)
        if (!cancelled) {
          setReport(data)
          setProcessing(false)
        }
      } catch (err) {
        attempts += 1
        if (err.response?.status === 404 && attempts < 5) {
          // report may still be computing right after /end — brief retry window
          setTimeout(load, 800)
        } else if (!cancelled) {
          setError('Could not load this session report.')
          setProcessing(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId])

  if (processing) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto text-center py-24">
          <p className="text-ink font-medium mb-4">Analyzing your study session…</p>
          <ul className="text-sm text-muted space-y-1.5">
            <li>Calculating focus time</li>
            <li>Analyzing distractions</li>
            <li>Preparing your report</li>
          </ul>
        </div>
      </AppLayout>
    )
  }

  if (error || !report) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-24">
          <p className="text-danger text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="text-brand-light text-sm hover:underline">
            Back to dashboard
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-xs text-subtle uppercase tracking-wide mb-1">Study Session Complete</p>
          <h1 className="font-display text-h3 text-ink">{report.goal}</h1>
          <p className="text-sm text-muted">{report.subject}</p>
        </div>

        <div className="flex flex-col items-center my-10">
          <FocusRing value={report.focus_score} size={140} strokeWidth={12} />
          <p className="text-sm text-muted mt-3">{report.classification}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <ReportMetric label="Duration" value={formatDuration(report.duration_seconds)} />
          <ReportMetric label="Focused" value={formatDuration(report.focused_seconds)} accent="text-focus" />
          <ReportMetric label="Distracted" value={formatDuration(report.distracted_seconds)} accent="text-distract" />
          <ReportMetric label="Tab Switches" value={report.tab_switches} />
        </div>

        <div className="flex items-center gap-2 justify-center mb-10 text-sm">
          {report.goal_completed === true && (
            <span className="flex items-center gap-1.5 text-focus"><CheckCircle2 size={16} /> Goal completed</span>
          )}
          {report.goal_completed === false && (
            <span className="flex items-center gap-1.5 text-distract"><XCircle size={16} /> Goal not completed</span>
          )}
          {report.goal_completed === null && (
            <span className="text-subtle">Goal completion not recorded</span>
          )}
        </div>

        {report.websites.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-ink mb-3">Website Activity</h2>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card text-subtle text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-medium">Website</th>
                    <th className="text-left px-4 py-2.5 font-medium">Time</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.websites.map((w, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2.5 text-ink">{w.domain}</td>
                      <td className="px-4 py-2.5 text-muted">{formatDuration(w.seconds)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge classification={w.classification} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {report.ai_insight ? (
          <div className="bg-brand-soft border border-brand/30 rounded-lg p-6 mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-light" />
              <h2 className="text-xs font-semibold text-brand-light uppercase tracking-wide">Kiko's Insight</h2>
            </div>
            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{report.ai_insight}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 mb-10 text-center">
            <p className="text-sm text-subtle">Insight unavailable — your session data is still saved.</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-brand text-white text-sm font-medium px-6 py-2.5 rounded hover:bg-brand-dark transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </AppLayout>
  )
}

function ReportMetric({ label, value, accent }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center">
      <p className="text-[11px] text-subtle uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-display text-xl font-semibold ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ classification }) {
  const config = {
    relevant: { label: 'Focused', color: 'text-focus' },
    distracting: { label: 'Distracted', color: 'text-distract' },
    neutral: { label: 'Neutral', color: 'text-subtle' },
  }[classification] || { label: classification, color: 'text-subtle' }

  return <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
}
