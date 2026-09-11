const API_BASE = "http://localhost:8000";
const app = document.getElementById("app");

let statusTimer = null;

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function getToken() {
  const { token } = await chrome.storage.local.get("token");
  return token || null;
}

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login-json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = "Login failed";
    try { const j = await res.json(); detail = j.detail || detail; } catch {}
    throw new Error(detail);
  }
  const data = await res.json();
  await chrome.storage.local.set({ token: data.access_token });
  chrome.runtime.sendMessage({ type: "AUTH_CHANGED" });
}

async function logout() {
  await chrome.storage.local.remove("token");
  chrome.runtime.sendMessage({ type: "AUTH_CHANGED" });
  render();
}

// ─── Views ──────────────────────────────────────────────
function renderLogin() {
  app.innerHTML = `
    <div class="wrap">
      <div class="header">
        <div class="logo">K</div>
        <div class="brand">KIKO <span class="ai">AI</span></div>
      </div>
      <div class="card">
        <div class="label">Sign in</div>
        <p class="muted" style="margin-top:0;margin-bottom:14px">
          Sign in with the same account you use on the KIKO web app.
        </p>
        <div id="login-error"></div>
        <form id="login-form">
          <div class="field">
            <label>Email</label>
            <input type="email" id="email" required placeholder="you@example.com" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="password" required placeholder="••••••••" />
          </div>
          <button type="submit" class="btn" id="login-btn">Sign in</button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("login-form");
  const btn = document.getElementById("login-btn");
  const errDiv = document.getElementById("login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errDiv.innerHTML = "";
    btn.disabled = true;
    btn.innerHTML = `<span class="loader"></span>Signing in...`;
    try {
      await login(
        document.getElementById("email").value.trim(),
        document.getElementById("password").value
      );
      render();
    } catch (err) {
      errDiv.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  });
}

function statusCard(label, cls, text) {
  return `
    <div class="card">
      <div class="label">${label}</div>
      <div class="status ${cls}">
        <div class="dot ${cls === "focused" ? "pulse" : ""}"></div>
        ${text}
      </div>
    </div>
  `;
}

function renderNoSession() {
  app.innerHTML = `
    <div class="wrap">
      ${headerHTML()}
      ${statusCard("Status", "idle", "No Study Session")}
      <div class="card">
        <p class="muted" style="margin:0">
          Start a study session in the KIKO web app to activate MindGuard.
        </p>
      </div>
      ${footerHTML()}
    </div>
  `;
  bindFooter();
}

function renderPaused(session) {
  app.innerHTML = `
    <div class="wrap">
      ${headerHTML()}
      ${statusCard("Status", "paused", "Session Paused")}
      <div class="card">
        <div class="label">Session</div>
        <div class="value">${escapeHtml(session.subject)}</div>
        <p class="muted">Monitoring is paused. Resume your session to continue.</p>
      </div>
      ${footerHTML()}
    </div>
  `;
  bindFooter();
}

function renderActive(session, currentTab, classification) {
  const focusState = classification?.focus_state || "focused";
  const labels = { focused: "Focused", attention: "Attention", distracted: "Distracted" };
  const statusText = labels[focusState] || "Focused";

  const tabHTML = currentTab ? `
    <div class="card">
      <div class="label">Current Activity</div>
      <div class="value">${escapeHtml(currentTab.domain || "")}</div>
      ${currentTab.title ? `<p class="muted">${escapeHtml(currentTab.title)}</p>` : ""}
      ${classification?.reason ? `<div class="divider"></div><p class="muted" style="margin:0">${escapeHtml(classification.reason)}</p>` : ""}
    </div>
  ` : `
    <div class="card">
      <div class="label">Current Activity</div>
      <p class="muted" style="margin:0">Waiting for browser activity...</p>
    </div>
  `;

  app.innerHTML = `
    <div class="wrap">
      ${headerHTML()}
      ${statusCard("Focus Status", focusState, statusText)}
      <div class="card">
        <div class="label">Session</div>
        <div class="value">${escapeHtml(session.subject)}</div>
        <p class="muted">${escapeHtml(session.goal || "")}</p>
      </div>
      ${tabHTML}
      ${footerHTML()}
    </div>
  `;
  bindFooter();
}

function headerHTML() {
  return `
    <div class="header">
      <div class="logo">K</div>
      <div class="brand">KIKO <span class="ai">AI</span></div>
    </div>
  `;
}

function footerHTML() {
  return `
    <div class="card" style="padding:12px 16px">
      <div class="row">
        <span>Extension</span>
        <strong style="color:#2E7D32">Connected ✓</strong>
      </div>
      <div class="row">
        <span>MindGuard</span>
        <strong>Active</strong>
      </div>
    </div>
    <button class="btn secondary" id="logout-btn">Sign out</button>
  `;
}

function bindFooter() {
  const btn = document.getElementById("logout-btn");
  if (btn) btn.addEventListener("click", logout);
}

// ─── Main render ────────────────────────────────────────
async function render() {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }

  const token = await getToken();
  if (!token) {
    renderLogin();
    return;
  }

  await fetchAndRender();
  statusTimer = setInterval(fetchAndRender, 3000);
}

async function fetchAndRender() {
  const token = await getToken();
  if (!token) {
    renderLogin();
    return;
  }

  let status = null;
  let live = null;

  try {
    const [sRes, lRes] = await Promise.all([
      fetch(`${API_BASE}/mindguard/status`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/mindguard/live`,   { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (sRes.status === 401) {
      await chrome.storage.local.remove("token");
      renderLogin();
      return;
    }

    status = sRes.ok ? await sRes.json() : null;
    live   = lRes.ok ? await lRes.json() : null;
  } catch {
    app.innerHTML = `
      <div class="wrap">
        ${headerHTML()}
        ${statusCard("Connection", "error", "Not Connected")}
        <div class="card">
          <p class="muted" style="margin:0">Unable to reach KIKO. Make sure the backend is running.</p>
        </div>
        ${footerHTML()}
      </div>
    `;
    bindFooter();
    return;
  }

  if (!status || !status.has_active_session) {
    renderNoSession();
    return;
  }

  if (status.status === "PAUSED") {
    renderPaused({
      subject: status.subject || "Study Session",
    });
    return;
  }

  const current = status.current_activity || null;
  const classification = current ? {
    focus_state: current.focus_state,
    reason: current.reason,
  } : null;

  // Build a small tab object for the UI
  const currentTab = current ? {
    domain: current.domain,
    title: current.page_title,
  } : null;

  renderActive(
    { subject: status.subject, goal: status.goal },
    currentTab,
    classification
  );
}

// Initial render
render();