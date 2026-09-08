# KIKO AI — Review 1 Feature Checklist

*A feature is marked Complete only after it passed an actual end-to-end test (ASGI-transport HTTP test for backend, `npm run build` + manual code review for frontend), not because the code exists.*

| Feature | Frontend | Backend | Database | Integration | Tested | Status |
|---|---|---|---|---|---|---|
| FR-01 Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-02 Start Study Session | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-03 Session Timer | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-04 Study Goal | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-05 Browser Activity Monitoring (extension) | ✓ | ✓ | ✓ | ✓ | ⚠️ | **Needs real-Chrome test** — logic verified via code review + the API side is tested; the actual `chrome.*` APIs can't run in this sandbox |
| FR-06/07/08 Relevance Detection | — | ✓ | — | ✓ | ✓ | **Complete** |
| FR-09 Distraction Warning | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-10 Tab Switch Tracking | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-11 Session Completion / analytics calc | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-12 Goal Completion | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-13 Focus Classification | — | ✓ | — | ✓ | ✓ | **Complete** |
| FR-14 Session Report | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| FR-15 PDF Upload | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (Review 0) |
| FR-16 AI Summary | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (Review 0) |
| FR-17 Flashcards | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (Review 0) |
| FR-18 Quiz | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (Review 0) |
| FR-19 Study Mentor (chat) | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (Review 0, relabeled) |
| §7 AI Session Insight | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** (fails gracefully, confirmed by test) |
| View Demo (guest access) | ✓ | ✓ | ✓ | ✓ | ✓ | **Complete** |
| Landing Page | ✓ | — | — | — | ⚠️ | **Needs visual review** — built to spec, not yet seen rendered in a real browser |
| Responsive layout (sidebar → bottom nav) | ✓ | — | — | — | ⚠️ | **Needs viewport testing** — implemented per §43, not yet verified at each breakpoint |
| Docker MongoDB | ✓ | — | — | ✓ | ⚠️ | **Needs your machine** — compose file written, can't run Docker inside this sandbox |

## Honest gaps (not yet done)

- **Real end-to-end embedding/FAISS test** — still blocked by this sandbox having no internet access to huggingface.co (same caveat as Review 0).
- **Real Chrome extension runtime test** — code is written and API-side tested, but `chrome.tabs`/`chrome.alarms`/`chrome.storage` only exist inside an actual Chrome browser. **You will need to load the unpacked extension and click through a real session to confirm FR-05 end-to-end.**
- **Visual QA in an actual browser** — I've verified the code builds and matches the design brief's spec on paper, but no human/browser has looked at the rendered pages yet.
- **Docker** — compose file is written and correct, but I cannot run `docker compose up` inside this sandbox to verify the container actually starts cleanly on your machine.

## What you should do to close these gaps

1. `docker compose up -d` at the project root, confirm `docker ps` shows `kiko-mongodb` healthy.
2. Run backend + frontend as before, click through the full PRD §10 demo flow yourself.
3. Load `extension/` as an unpacked extension in `chrome://extensions` (Developer Mode), log in via the popup, start a session, and browse a relevant + distracting site to confirm the warning fires.
