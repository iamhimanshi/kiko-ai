# MindGuard — Chrome Extension Setup

## Load it (developer mode)

1. Make sure the backend is running at `http://localhost:8000` (see `backend/README` / main project README).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `extension/` folder.
5. KIKO AI — MindGuard now appears in your extensions toolbar. Pin it for easy access.

## Using it

1. Click the MindGuard icon and log in with the **same account** you use on the KIKO web app.
2. Go to the KIKO web app, start a study session as usual.
3. MindGuard automatically detects the active session within about a minute (or immediately if you reopen the popup) and starts tracking — no need to manually "connect" it every time.
4. Reopen the popup any time to see live status: current focus state, elapsed time, focus score.
5. Log out from the popup when you're done, or it'll simply stop tracking once the session ends.

## What it tracks (and what it doesn't)

Per the PRD, MindGuard only reads: the active tab's **domain**, **page title**, **time spent**, and **tab switches**. It never reads keystrokes, mouse movement, scroll position, or page content — this is enforced by what the extension's permissions even allow it to see, not just a policy promise.

## Known limitation (documented, not hidden)

Chrome's `alarms` API can't reliably fire more than once a minute in production. Tab **switches** are detected and reported instantly (no delay). But if you stay on a single distracting tab without switching away, the worst-case delay before that time is reported to the backend is about 60 seconds, because of the periodic-alarm backstop. In practice, tab switches happen often enough during real browsing that this rarely matters — but it's worth knowing for the demo.

## Troubleshooting

- **Popup shows "No active study session"** → make sure you started a session in the web app, then wait up to a minute or reopen the popup.
- **Login fails in the popup** → the extension talks to `http://localhost:8000` — confirm the backend is running and reachable at that address.
- **Nothing seems to be tracked** → check `chrome://extensions` → MindGuard → "service worker" → "Inspect" to view console logs/errors.
