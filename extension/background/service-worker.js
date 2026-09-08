/**
 * MindGuard background service worker.
 *
 * Chrome constraint this code works around: MV3 service workers are
 * suspended after ~30s idle, and chrome.alarms cannot reliably fire
 * more often than once per minute in production. So instead of a
 * strict "flush every 15s" timer, we use:
 *   1. Instant flush on every tab switch / URL change (these listener
 *      events are NOT throttled — they fire immediately, no alarm needed).
 *   2. A recursive setTimeout heartbeat (~15s) that flushes the CURRENT
 *      tab's accumulated time while the worker happens to be alive.
 *   3. A 1-minute chrome.alarms backstop that wakes a suspended worker
 *      and restarts the heartbeat — guarantees a long, unswitched tab
 *      still gets reported at least once a minute.
 *
 * This keeps tab-switch reporting (and therefore FR-10 tab-switch
 * counting) instantaneous, while accepting that a single continuously
 * open distracting tab may take up to ~60s worst case to surface a
 * warning if the heartbeat happened to be dropped by suspension.
 */

const API_BASE_CANDIDATES = ['http://localhost:8000', 'http://127.0.0.1:8000']
const HEARTBEAT_MS = 15000
const ALARM_NAME = 'kiko-heartbeat-backstop'

let apiBase = API_BASE_CANDIDATES[0]
let tracking = null // { domain, title, startedAt, tabId }
let heartbeatTimer = null

async function getStored(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
}
async function setStored(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve))
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function isTrackableUrl(url) {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

async function apiFetch(path, options = {}) {
  const { kiko_token: token } = await getStored(['kiko_token'])
  if (!token) throw new Error('Not logged in')

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${path} -> ${res.status}: ${body}`)
  }
  return res.json()
}

/** Flush whatever time has accumulated on the currently tracked tab as
 * one activity event, optionally flagged as a tab_switch boundary. */
async function flush(tabSwitch = false) {
  if (!tracking) return
  const { kiko_session_id: sessionId } = await getStored(['kiko_session_id'])
  if (!sessionId) return

  const elapsedSeconds = Math.round((Date.now() - tracking.startedAt) / 1000)
  if (elapsedSeconds <= 0) return

  const event = {
    domain: tracking.domain,
    page_title: tracking.title || '',
    duration_seconds: elapsedSeconds,
    tab_switch: tabSwitch,
  }

  // Reset the accumulation window regardless of network outcome — we
  // don't want a slow/failed request to double-count the same seconds.
  tracking.startedAt = Date.now()

  try {
    const result = await apiFetch(`/api/sessions/${sessionId}/activity`, {
      method: 'POST',
      body: JSON.stringify({ events: [event] }),
    })
    await setStored({ kiko_last_status: result })
  } catch (err) {
    // Session may have ended from the web app, or token expired —
    // either way, stop tracking rather than looping on a dead session.
    if (String(err.message).includes('404') || String(err.message).includes('400')) {
      await stopTracking()
    }
  }
}

async function startTrackingTab(tab) {
  if (!tab || !isTrackableUrl(tab.url)) {
    tracking = null
    return
  }
  const domain = domainFromUrl(tab.url)
  if (!domain) {
    tracking = null
    return
  }
  tracking = {
    domain,
    title: tab.title || '',
    startedAt: Date.now(),
    tabId: tab.id,
  }
}

async function handleTabChange(tab) {
  const { kiko_session_id: sessionId } = await getStored(['kiko_session_id'])
  if (!sessionId) {
    tracking = null
    return
  }
  // flush the PREVIOUS tab's time, flagged as a tab switch boundary
  await flush(true)
  await startTrackingTab(tab)
}

function scheduleHeartbeat() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer)
  heartbeatTimer = setTimeout(async () => {
    await flush(false)
    scheduleHeartbeat()
  }, HEARTBEAT_MS)
}

async function stopTracking() {
  tracking = null
  await setStored({ kiko_session_id: null })
  if (heartbeatTimer) clearTimeout(heartbeatTimer)
}

// --- Extension lifecycle wiring ---

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => handleTabChange(tab))
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only react to URL/title changes on the currently tracked tab, or a
  // freshly completed navigation on the active tab — avoids re-tracking
  // on every unrelated background-tab update.
  if (changeInfo.status === 'complete' && tab.active) {
    await handleTabChange(tab)
    return
  }
  // YouTube (and other SPAs) swap the video/page without a fresh
  // 'complete' navigation event — only the tab title changes. Without
  // this branch, MindGuard would keep classifying based on whatever
  // video title was loaded first, so FR-08 (YouTube title-based
  // relevance) would silently go stale after the first video switch.
  if (changeInfo.title && tab.active && tracking && tab.id === tracking.tabId) {
    await handleTabChange(tab)
  }
})

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return
  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    if (tabs[0]) handleTabChange(tabs[0])
  })
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    flush(false)
    autoDiscoverActiveSession()
    scheduleHeartbeat() // restart fine-grained heartbeat after a wake
  }
})

/** If we're logged in but not currently tracking a session, check
 * whether the user started one from the web app — makes MindGuard
 * "just connect" automatically (design brief §37) without requiring
 * the user to manually reopen the popup after every session start. */
async function autoDiscoverActiveSession() {
  const { kiko_token: token, kiko_session_id: sessionId } = await getStored(['kiko_token', 'kiko_session_id'])
  if (!token || sessionId) return

  try {
    const active = await apiFetch('/api/sessions/active')
    if (active) {
      await setStored({ kiko_session_id: active.id })
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) startTrackingTab(tabs[0])
      })
    }
  } catch {
    // not logged in / offline — nothing to do, next alarm tick retries
  }
}

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
  scheduleHeartbeat()
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
  scheduleHeartbeat()
})

// Messages from the popup (login success, session selected, logout)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'KIKO_SESSION_STARTED') {
    setStored({ kiko_session_id: message.sessionId }).then(async () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) startTrackingTab(tabs[0])
      })
      scheduleHeartbeat()
      sendResponse({ ok: true })
    })
    return true
  }
  if (message.type === 'KIKO_SESSION_ENDED' || message.type === 'KIKO_LOGOUT') {
    stopTracking().then(() => sendResponse({ ok: true }))
    return true
  }
})
