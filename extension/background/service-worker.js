// ─────────────────────────────────────────────────────────
// KIKO AI — MindGuard Service Worker (Manifest V3)
// ─────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000";
const HEARTBEAT_MS = 30 * 1000;
const SESSION_POLL_MS = 15 * 1000;
const MIN_FLUSH_GAP_MS = 3 * 1000;
const SKIP_HOSTS = ["localhost", "127.0.0.1"];

const state = {
  token: null,
  session: null,
  currentTab: null,
  blockedDomains: [],
  heartbeatTimer: null,
  sessionTimer: null,
  lastInterventionLevel: 0,
  lastFlushedAt: 0,
  lastFlushedKey: null,
  isFlushing: false,
};

// ─── Boot ───────────────────────────────────────────────
async function boot() {
  const { token } = await chrome.storage.local.get("token");
  state.token = token || null;
  if (!state.token) { setBadge("", "#6B7280"); return; }
  await refreshSession();
  await refreshBlocked();
  startTimers();
}

function startTimers() {
  if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
  if (state.sessionTimer) clearInterval(state.sessionTimer);
  state.heartbeatTimer = setInterval(onHeartbeat, HEARTBEAT_MS);
  state.sessionTimer = setInterval(async () => {
    await refreshSession();
    await refreshBlocked();
  }, SESSION_POLL_MS);
}

// ─── HTTP ───────────────────────────────────────────────
async function apiGet(path) {
  if (!state.token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });
    if (res.status === 401) { await clearAuth(); return null; }
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function apiPost(path, body) {
  if (!state.token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { await clearAuth(); return null; }
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function clearAuth() {
  await chrome.storage.local.remove("token");
  state.token = null;
  state.session = null;
  state.currentTab = null;
  state.blockedDomains = [];
  setBadge("", "#6B7280");
  if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
  if (state.sessionTimer) clearInterval(state.sessionTimer);
}

// ─── Badge ──────────────────────────────────────────────
function setBadge(text, color) {
  try {
    chrome.action.setBadgeText({ text });
    if (color) chrome.action.setBadgeBackgroundColor({ color });
  } catch (_) {}
}

function updateBadgeForFocus(focusState) {
  switch (focusState) {
    case "focused":    setBadge("●", "#2E7D32"); break;
    case "attention":  setBadge("●", "#D97706"); break;
    case "distracted": setBadge("!", "#D14343"); break;
    case "paused":     setBadge("Ⅱ", "#6B7280"); break;
    case "idle":       setBadge("·", "#9CA3AF"); break;
    default:           setBadge("", "#6B7280");
  }
}

// ─── Session ────────────────────────────────────────────
async function refreshSession() {
  const session = await apiGet("/sessions/active");
  if (!session || !session.id) {
    state.session = null;
    state.currentTab = null;
    setBadge("", "#6B7280");
    return;
  }
  state.session = session;
  if (session.status === "PAUSED") {
    state.currentTab = null;
    updateBadgeForFocus("paused");
  } else if (!state.currentTab) {
    await startTrackingActiveTab();
  }
}

// ─── Blocked list ───────────────────────────────────────
async function refreshBlocked() {
  const list = await apiGet("/mindguard/blocked-websites");
  state.blockedDomains = Array.isArray(list) ? list.map((b) => b.domain) : [];
}

function findBlockedMatch(url) {
  const domain = normalizeDomain(url);
  if (!domain) return null;
  return state.blockedDomains.find(
    (b) => domain === b || domain.endsWith("." + b)
  ) || null;
}

// ─── Tab tracking ───────────────────────────────────────
function normalizeDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch { return ""; }
}

function isSkippedHost(url) {
  const host = normalizeDomain(url);
  return SKIP_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

async function startTrackingActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url) { state.currentTab = null; return; }
  if (!/^https?:/.test(tab.url)) { state.currentTab = null; return; }
  if (isSkippedHost(tab.url)) { state.currentTab = null; return; }
  state.currentTab = {
    url: tab.url,
    title: tab.title || "",
    domain: normalizeDomain(tab.url),
    startedAt: Date.now(),
  };
}

async function flushCurrentActivity(reason) {
  if (!state.session || state.session.status !== "ACTIVE") return;
  if (!state.currentTab) return;
  if (state.isFlushing) return;

  const now = Date.now();
  const duration = Math.floor((now - state.currentTab.startedAt) / 1000);
  if (duration < 5) return;

  const key = `${state.currentTab.url}|${state.currentTab.title}`;
  if (state.lastFlushedKey === key && now - state.lastFlushedAt < MIN_FLUSH_GAP_MS) {
    state.currentTab.startedAt = now;
    return;
  }

  state.isFlushing = true;
  state.lastFlushedKey = key;
  state.lastFlushedAt = now;

  const payload = {
    session_id: state.session.id,
    activities: [{
      url: state.currentTab.url,
      page_title: state.currentTab.title,
      time_spent_seconds: duration,
      tab_switches: reason === "tab_switch" ? 1 : 0,
    }],
  };

  try {
    const res = await apiPost("/mindguard/activity", payload);
    state.currentTab.startedAt = Date.now();
    if (res && Array.isArray(res.results) && res.results[0]) {
      handleClassification(res.results[0]);
    }
  } finally {
    state.isFlushing = false;
  }
}

function handleClassification(result) {
  updateBadgeForFocus(result.focus_state);
  const level = result.intervention_level || 0;
  if (level >= 2 && level > state.lastInterventionLevel) {
    showInterventionNotification(result);
  }
  state.lastInterventionLevel = level;
}

function showInterventionNotification(result) {
  const level = result.intervention_level || 1;
  const title = result.intervention_title || "MindGuard";
  const message = result.intervention_message || "This activity looks unrelated to your study goal.";
  try {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231B4332'/%3E%3Ctext x='32' y='44' font-size='36' font-family='Arial' fill='white' text-anchor='middle' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E",
      title,
      message,
      priority: level >= 3 ? 2 : 1,
    });
  } catch (_) {}
}

// ─── Blocking ───────────────────────────────────────────
async function enforceBlock(tabId, url) {
  if (!state.session || state.session.status !== "ACTIVE") return false;
  if (!url || !/^https?:/.test(url)) return false;
  if (isSkippedHost(url)) return false;

  const matched = findBlockedMatch(url);
  if (!matched) return false;

  // Log the blocked attempt
  apiPost("/mindguard/activity", {
    session_id: state.session.id,
    activities: [{
      url,
      page_title: "",
      time_spent_seconds: 0,
      was_blocked: true,
    }],
  });

  // Redirect to focus screen
  const blockedUrl = chrome.runtime.getURL(
    `blocked/blocked.html?domain=${encodeURIComponent(matched)}`
  );
  chrome.tabs.update(tabId, { url: blockedUrl });
  return true;
}

// ─── Event handlers ─────────────────────────────────────
async function onTabActivated() {
  await flushCurrentActivity("tab_switch");
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab && tab.url) {
    const blocked = await enforceBlock(tab.id, tab.url);
    if (blocked) return;
  }
  await startTrackingActiveTab();
}

async function onTabUpdated(tabId, changeInfo, tab) {
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!activeTab || activeTab.id !== tabId) return;

  if (changeInfo.title && state.currentTab) {
    state.currentTab.title = changeInfo.title;
  }
  if (changeInfo.url) {
    const blocked = await enforceBlock(tabId, changeInfo.url);
    if (blocked) return;
    if (isSkippedHost(changeInfo.url)) {
      state.currentTab = null;
      return;
    }
    await flushCurrentActivity("tab_switch");
    await startTrackingActiveTab();
  }
}

async function onWindowFocusChanged(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await flushCurrentActivity("blur");
  } else {
    await startTrackingActiveTab();
  }
}

async function onHeartbeat() {
  await refreshSession();
  await flushCurrentActivity("heartbeat");
}

// ─── Listeners ──────────────────────────────────────────
chrome.tabs.onActivated.addListener(onTabActivated);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.windows.onFocusChanged.addListener(onWindowFocusChanged);

chrome.alarms.create("wakeup", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(() => {
  if (!state.token) return;
  onHeartbeat();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "AUTH_CHANGED") { boot().then(() => sendResponse({ ok: true })); return true; }
  if (msg.type === "GET_STATUS") {
    sendResponse({ session: state.session, currentTab: state.currentTab, hasToken: !!state.token });
    return true;
  }
  if (msg.type === "REFRESH_SESSION") {
    Promise.all([refreshSession(), refreshBlocked()]).then(() => sendResponse({ ok: true }));
    return true;
  }
});

chrome.runtime.onStartup.addListener(boot);
chrome.runtime.onInstalled.addListener(boot);
boot();