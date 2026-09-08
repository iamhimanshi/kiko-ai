/**
 * Popup script — vanilla JS, no build step needed for the extension.
 * Reuses the exact same /api/auth/login and /api/sessions/* endpoints
 * the web app uses; no separate auth system for the extension.
 */

const API_BASE_CANDIDATES = ['http://localhost:8000', 'http://127.0.0.1:8000']
let apiBase = API_BASE_CANDIDATES[0]
const root = document.getElementById('root')

function getStored(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
}
function setStored(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve))
}

async function apiFetch(path, options = {}, token = null) {
  const authToken = token ?? (await getStored(['kiko_token'])).kiko_token
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function render() {
  const { kiko_token: token, kiko_session_id: sessionId } = await getStored(['kiko_token', 'kiko_session_id'])

  if (!token) {
    renderLogin()
    return
  }

  if (!sessionId) {
    renderNoActiveSession()
    return
  }

  renderConnecting()
  try {
    const live = await apiFetch(`/api/sessions/${sessionId}/live`)
    const session = await apiFetch(`/api/sessions/${sessionId}`)
    renderActiveSession(session, live)
  } catch {
    // session likely ended elsewhere — clear and fall back
    await setStored({ kiko_session_id: null })
    renderNoActiveSession()
  }
}

function renderLogin() {
  root.innerHTML = `
    <div id="error" class="error" style="display:none"></div>
    <label for="email">Email</label>
    <input id="email" type="email" placeholder="you@example.com" />
    <label for="password">Password</label>
    <input id="password" type="password" placeholder="••••••••" />
    <button id="loginBtn">Log in</button>
  `
  document.getElementById('loginBtn').addEventListener('click', handleLogin)
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const errorEl = document.getElementById('error')
  const btn = document.getElementById('loginBtn')
  errorEl.style.display = 'none'
  btn.disabled = true
  btn.textContent = 'Logging in…'

  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await setStored({ kiko_token: data.access_token, kiko_user: data.user })
    await render()
  } catch {
    errorEl.textContent = 'Could not log in. Check your credentials.'
    errorEl.style.display = 'block'
    btn.disabled = false
    btn.textContent = 'Log in'
  }
}

function renderNoActiveSession() {
  root.innerHTML = `
    <div class="status-row">
      <span class="status-dot status-disconnected"></span>
      <span>No active study session</span>
    </div>
    <p class="muted">Start a session from the KIKO AI dashboard, then reopen this popup to connect MindGuard.</p>
    <button class="secondary" id="logoutBtn">Log out</button>
  `
  document.getElementById('logoutBtn').addEventListener('click', handleLogout)

  // Also try auto-discovering an active session in case one was started
  // in the web app after this popup was last opened.
  apiFetch('/api/sessions/active')
    .then(async (session) => {
      if (session) {
        await setStored({ kiko_session_id: session.id })
        chrome.runtime.sendMessage({ type: 'KIKO_SESSION_STARTED', sessionId: session.id })
        await render()
      }
    })
    .catch(() => {})
}

function renderConnecting() {
  root.innerHTML = `
    <div class="status-row">
      <span class="status-dot status-connecting"></span>
      <span>Connecting…</span>
    </div>
  `
}

function renderActiveSession(session, live) {
  const statusLabel = { focused: 'Focused', distracted: 'Distracted', monitoring: 'Monitoring' }[live.status]
  const statusClass = { focused: 'status-connected', distracted: 'status-disconnected', monitoring: 'status-connecting' }[live.status]

  root.innerHTML = `
    <div class="status-row">
      <span class="status-dot ${statusClass}"></span>
      <span>MindGuard Active — ${statusLabel}</span>
    </div>
    <div class="card">
      <div class="goal">Goal</div>
      <div class="goal-text">${escapeHtml(session.goal)}</div>
      <div class="metric-row"><span>Session</span><span class="metric-value">${formatTime(live.elapsed_seconds)}</span></div>
      <div class="metric-row"><span>Focus score</span><span class="metric-value">${live.focus_score}%</span></div>
    </div>
    <button class="secondary" id="logoutBtn" style="margin-top:14px">Log out</button>
  `
  document.getElementById('logoutBtn').addEventListener('click', handleLogout)
}

async function handleLogout() {
  chrome.runtime.sendMessage({ type: 'KIKO_LOGOUT' })
  await setStored({ kiko_token: null, kiko_session_id: null, kiko_user: null })
  await render()
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

render()
