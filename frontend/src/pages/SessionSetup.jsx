import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import AppLayout from '../layouts/AppLayout'
import * as sessionsApi from '../services/sessionsApi'

const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Web Development', 'Programming Practice', 'Exam Preparation', 'Other']
const DURATION_PRESETS = [25, 45, 60, 90]

export default function SessionSetup() {
  const navigate = useNavigate()
  const [goal, setGoal] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [customDuration, setCustomDuration] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [tasks, setTasks] = useState([])
  const [taskInput, setTaskInput] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function addTask() {
    const text = taskInput.trim()
    if (!text) return
    setTasks((prev) => [...prev, text])
    setTaskInput('')
  }

  function removeTask(index) {
    setTasks((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!goal.trim()) {
      setError('Study goal is required.')
      return
    }
    const minutes = useCustom ? Number(customDuration) : durationMinutes
    if (!minutes || minutes < 1) {
      setError('Enter a valid duration.')
      return
    }

    setSubmitting(true)
    try {
      const session = await sessionsApi.createSession({
        subject,
        goal: goal.trim(),
        plannedDurationSeconds: minutes * 60,
        tasks,
      })
      navigate(`/session/${session.id}`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start the session. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout title="Start a Study Session">
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-8">
          <label className="block text-sm font-medium text-ink mb-2" htmlFor="goal">
            What do you want to accomplish?
          </label>
          <textarea
            id="goal"
            required
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Complete Linked List implementation"
            className="w-full bg-card border border-border rounded px-4 py-3 text-ink placeholder:text-subtle outline-none focus:border-brand-light transition-colors resize-none"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-ink mb-2" htmlFor="subject">Subject</label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full sm:w-64 bg-card border border-border rounded px-4 py-3 text-ink outline-none focus:border-brand-light transition-colors"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <p className="block text-sm font-medium text-ink mb-2">Duration</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => { setDurationMinutes(m); setUseCustom(false) }}
                className={`px-4 py-2 rounded text-sm border transition-colors ${
                  !useCustom && durationMinutes === m
                    ? 'border-brand bg-brand-soft text-brand-light'
                    : 'border-border text-muted hover:text-ink'
                }`}
              >
                {m} min
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`px-4 py-2 rounded text-sm border transition-colors ${
                useCustom ? 'border-brand bg-brand-soft text-brand-light' : 'border-border text-muted hover:text-ink'
              }`}
            >
              Custom
            </button>
            {useCustom && (
              <input
                type="number"
                min={1}
                max={360}
                autoFocus
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="minutes"
                className="w-28 bg-card border border-border rounded px-3 py-2 text-sm text-ink outline-none focus:border-brand-light"
              />
            )}
          </div>
        </div>

        <div className="mb-8">
          <p className="block text-sm font-medium text-ink mb-2">Study tasks <span className="text-subtle font-normal">(optional)</span></p>
          <div className="flex gap-2 mb-3">
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTask() } }}
              placeholder="e.g. Implement insertion"
              className="flex-1 bg-card border border-border rounded px-4 py-2.5 text-sm text-ink placeholder:text-subtle outline-none focus:border-brand-light"
            />
            <button
              type="button"
              onClick={addTask}
              className="px-3 rounded border border-border text-muted hover:text-ink hover:border-brand-light transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          {tasks.length > 0 && (
            <ul className="space-y-1.5">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-center justify-between bg-card border border-border rounded px-3 py-2 text-sm text-ink">
                  {t}
                  <button type="button" onClick={() => removeTask(i)} className="text-subtle hover:text-danger transition-colors">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-sm text-danger mb-4" role="alert">⚠ {error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand text-white font-medium px-6 py-3 rounded hover:bg-brand-dark transition disabled:opacity-60"
        >
          {submitting ? 'Starting…' : 'Start Study Session'}
        </button>
      </form>
    </AppLayout>
  )
}
