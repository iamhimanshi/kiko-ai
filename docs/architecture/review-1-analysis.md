# KIKO AI — Review 1 Analysis
*Written before implementation, per the PRD's own development process. Nothing below has been coded yet — this is the map, not the territory.*

---

## 1. Feature Breakdown (PRD → concrete units of work)

| # | PRD Requirement | Status | What it actually requires |
|---|---|---|---|
| FR-01 | Dashboard | **New build** | Today's stats, recent sessions list, focus overview, "Start Session" CTA |
| FR-02 | Start Study Session | **New build** | Form: subject, goal, duration (preset/custom), optional tasks |
| FR-03 | Session Timer | **New build** | Start time, live elapsed time, end action |
| FR-04 | Study Goal | **New build** | Goal text stored on session, read by relevance engine |
| FR-05 | Browser Activity Monitoring | **New build** | Chrome extension (Manifest V3): active tab, domain, title, time, tab switches |
| FR-06/07/08 | Relevance/Distraction Detection | **New build** | Rule-based engine: goal keywords vs domain + page title |
| FR-09 | Distraction Warning | **New build** | Intervention card in extension popup/content script, "Return to Study" |
| FR-10 | Tab Switch Tracking | **New build** | Counter, incremented on tab-change events |
| FR-11 | Session Completion | **New build** | On end: compute duration/focus/distraction/switches/websites/score |
| FR-12 | Goal Completion | **New build** | User self-reports completed/not-completed at session end |
| FR-13 | Focus Classification | **New build** | Threshold table (90–100 / 75–89 / 50–74 / 0–49) |
| FR-14 | Session Report | **New build** | Aggregates FR-11 through FR-13 into one view |
| FR-15–19 | Study Assistant (upload/summary/flashcards/quiz/mentor) | **Already built** (Review 0) | Reuse as-is — this is the existing backend/frontend from our last milestone |
| §7 | AI Session Insight | **New build** | Send structured (not raw) session analytics to Groq, get a short interpretation |

**Net new surface area for Review 1:** Study Session lifecycle, Chrome Extension, Relevance Engine, Analytics/Report, AI Session Insight, Dashboard, Landing. **Reused untouched:** auth, document upload, chat/summary/flashcards/quiz backend and UI (renaming "Study Mentor" is presentation-layer only — same `/api/assistant/chat` endpoint).

---

## 2. Ambiguities I'm resolving now (flagging per your instructions, not silently deciding)

| Ambiguity | Decision | Why |
|---|---|---|
| How does the extension authenticate as "the same user" as the web app? | Extension popup has its own mini login form hitting the existing `/api/auth/login`; JWT stored in `chrome.storage.local` | No new auth system needed; reuses what's tested and working |
| How often does the extension send activity data? | Aggregate and POST every **15 seconds**, plus immediately on tab switch/idle | PRD explicitly requires aggregation before transmission (NFR); 15s balances responsiveness vs. backend load |
| How long must "distracted" persist before a warning fires? | **10 seconds** of sustained distraction, not instant | Avoids false-positive warnings from a quick accidental tab click |
| Does "Monitoring" (idle/loading) time count toward the focus-score denominator? | **No** — focus score = focused ÷ (focused + distracted), idle excluded | Otherwise idle time silently drags the score down for no behavioral reason |
| Does the professor's "View Demo" path require login? | **No** — a `/demo` route creates a throwaway guest session (no persistence beyond that session) so nothing blocks the walkthrough | Design brief explicitly calls this out (§13) |
| Are tasks required to start a session? | **No**, optional — only `goal` (free text) drives the relevance engine | PRD FR-02 says tasks are "optional" |
| What happens if Groq fails during session-insight generation? | Report still renders fully with all computed metrics; the AI Insight card shows "Insight unavailable — try again" instead of blocking the report | NFR: "temporary AI failure should not destroy the underlying session analytics" — direct PRD quote |
| YouTube relevance — how is the "video title" obtained without YouTube API access? | Extension reads `document.title` via a content script injected only on youtube.com watch pages (no YouTube API key needed) | Keeps Phase 1 free of a new external API/credential |

---

## 3. Data Model (additions to the existing `users`/`documents` collections)

```
study_sessions
  _id, user_email, subject, goal, planned_duration_seconds,
  status ("active" | "completed"), started_at, ended_at,
  goal_completed (bool | null), tasks: [{ text, done }]

browser_activity_events        # raw aggregated pings from the extension
  session_id, timestamp, domain, page_title,
  duration_seconds, classification ("relevant"|"distracting"|"neutral"),
  tab_switch (bool)

distraction_events             # only the sustained (>10s) distractions
  session_id, started_at, domain, page_title,
  duration_seconds, severity ("low"|"medium"|"high")

session_reports                # computed once, at session end — never recomputed live
  session_id, duration_seconds, focused_seconds, distracted_seconds,
  tab_switches, websites: [{domain, seconds, classification}],
  focus_score, classification ("Highly Focused"|...),
  goal_completed, ai_insight (text, nullable)
```

Rationale for a separate `session_reports` collection instead of computing on read: PRD FR-11 implies a point-in-time calculation ("when the user ends the session, the system shall calculate…") — recomputing later would let the report drift if activity events are pruned or edited.

---

## 4. New API Surface

```
POST   /api/sessions                 create + start a session
GET    /api/sessions/{id}            current session state (for the live timer)
POST   /api/sessions/{id}/activity   extension posts an aggregated activity batch
POST   /api/sessions/{id}/end        stop timer, trigger report calculation
GET    /api/sessions/{id}/report     fetch the computed report
GET    /api/sessions                 dashboard: recent sessions list
GET    /api/dashboard/summary        today's stats (study time, focus score, sessions count)
```

All under the existing JWT auth dependency (`get_current_user`) — same pattern as `documents`/`assistant`.

---

## 5. Architecture Additions

```
backend/app/engines/
  relevance_engine.py    goal → keywords → domain/title match → relevant|distracting|neutral
  focus_engine.py         raw events → focused/distracted seconds, tab switches
  analytics_engine.py     focus score, classification, website breakdown
backend/app/services/
  session_service.py      session CRUD, lifecycle
  report_service.py       orchestrates engines + calls ai_service for insight

extension/
  manifest.json            Manifest V3
  background/service-worker.js   tracks active tab, aggregates, posts every 15s
  content/content.js        injected on youtube.com — reads video title
  popup/                    login + live session status + "MindGuard Active" indicator
```

Nothing here touches the already-working `auth`, `documents`, or `assistant` modules — additive only, consistent with "No Breaking Existing Features."

---

## 6. Frontend Additions (React)

New pages: `Landing` (redesign to match design brief hero), `Dashboard`, `SessionSetup`, `ActiveSession`, `SessionReport`. `Assistant` page gets relabeled tabs (Study Mentor instead of "Chat") — no functional change.

New shared components: `FocusRing` (already built, reused for report hero metric), `MetricCard`, `SessionTimer`, `DistractionWarning`, `FocusTimeline`, `ActivityTable`, `AIInsightCard`, `TaskList`.

Design tokens **replace** my earlier placeholder palette with the brief's actual spec (`#080B16` bg, `#6366F1` indigo brand, `#22D3EE` focus cyan, `#F59E0B`/`#F97316` warning/distract) — Inter typeface, 8px spacing scale, moderate radii. I'll implement this exactly as specified in §3–9 of the design brief rather than reusing my earlier guess.

---

## 7. Build Order (maps directly to the PRD's Phase A–G)

1. **Phase A/B** — already done (repo cleanup, Study Assistant refactor) ✅
2. **Phase C** — Study Session backend (`session_service`, endpoints) + frontend (Setup, Active Session, Timer)
3. **Phase D** — Chrome Extension (tab tracking, aggregation, popup login)
4. **Phase E** — Relevance Engine + wire extension → backend → distraction warning
5. **Phase F** — Analytics engine + Session Report screen
6. **Phase G** — AI Session Insight, Dashboard, Landing redesign, full integration test of the 21-step demo flow in §10 of the PRD, then tag `v0.1-review-1`

---

## 8. Testing Strategy

Per-feature: unit test each engine (relevance classification on a table of goal/domain/title fixtures; focus-score math on synthetic event sequences) — these are pure functions, cheapest to get right in isolation. Integration: ASGI-transport HTTP tests (same technique I used for auth) for the full session lifecycle: create → post activity → end → fetch report. Manual: the exact 21-step professor walkthrough from PRD §10, run start-to-finish before tagging the release.

---

## 9. Risks

- **Extension ↔ localhost CORS/host permissions** during dev — needs `http://localhost:8000/*` in `manifest.json` host_permissions, easy to forget and silently fails.
- **YouTube title detection** breaks if YouTube changes its DOM — content script should read `document.title` (stable) rather than scraping page elements.
- **Rule-based relevance engine will misclassify sometimes** — this is expected and PRD-acknowledged (ML classifier is explicitly out of scope); worth a small "why was this flagged" affordance in the warning card so it doesn't feel arbitrary (design brief §23 already asks for this).
