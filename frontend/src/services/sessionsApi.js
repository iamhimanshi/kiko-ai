import api from './api'

export async function createSession({ subject, goal, plannedDurationSeconds, tasks = [] }) {
  const { data } = await api.post('/api/sessions', {
    subject,
    goal,
    planned_duration_seconds: plannedDurationSeconds,
    tasks: tasks.map((text) => ({ text })),
  })
  return data
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}`)
  return data
}

export async function getActiveSession() {
  const { data } = await api.get('/api/sessions/active')
  return data
}

export async function getLiveStatus(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}/live`)
  return data
}

export async function postActivity(sessionId, events) {
  const { data } = await api.post(`/api/sessions/${sessionId}/activity`, { events })
  return data
}

export async function endSession(sessionId, goalCompleted) {
  const { data } = await api.post(`/api/sessions/${sessionId}/end`, { goal_completed: goalCompleted })
  return data
}

export async function getReport(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}/report`)
  return data
}

export async function listSessions() {
  const { data } = await api.get('/api/sessions')
  return data
}

export async function getDashboardSummary() {
  const { data } = await api.get('/api/dashboard/summary')
  return data
}
