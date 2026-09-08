# HOW_TO_START.md — KIKO AI

A complete reference for setting up and running the KIKO AI project. Keep this file at the root of the `kiko-ai` project folder.

---

## What this project is

KIKO AI is a study companion with two parts:
- **Study Assistant** — upload PDFs, get AI summaries, flashcards, quizzes, and a chat-based Study Mentor
- **MindGuard** — a Chrome extension that tracks study sessions and warns you when your browsing drifts off-goal

**Stack:** React + Vite + Tailwind (frontend) · FastAPI + Python (backend) · MongoDB via Docker (database) · Groq (AI) · Chrome Extension Manifest V3 (MindGuard)

---

## Prerequisites (install once, if you don't already have them)

| Tool | Check if installed | Get it |
|---|---|---|
| Python 3.10+ | `python --version` | https://www.python.org/downloads/ |
| Node.js 18+ | `node --version` | https://nodejs.org/ |
| Docker Desktop | Open the app, confirm it launches | https://www.docker.com/products/docker-desktop/ |
| A Groq API key | — | Free at https://console.groq.com |

---

## First-time setup (do this once)

### 1. Unzip the project and enter it
```bash
cd kiko-ai
```

### 2. Start MongoDB with Docker
```bash
docker compose up -d
```

### 3. Set up the backend
```bash
cd backend
python -m venv venv
```
Activate the virtual environment:
```bash
venv\Scripts\activate
```
*(Mac/Linux instead: `source venv/bin/activate`)*

Install dependencies:
```bash
pip install -r requirements.txt
```
Create your environment file:
```bash
copy .env.example .env
```
*(Mac/Linux instead: `cp .env.example .env`)*

Now open `backend/.env` in a text editor and fill in:
```
GROQ_API_KEY=your_actual_groq_key_here
JWT_SECRET=any_long_random_string_you_make_up
```
Leave `MONGODB_URI` as it is — it's already pointed at the Docker container.

### 4. Set up the frontend
Open a **new terminal window**, then:
```bash
cd kiko-ai/frontend
npm install
copy .env.example .env
```
*(Mac/Linux instead: `cp .env.example .env`)*

The default value in `frontend/.env` is already correct:
```
VITE_API_BASE_URL=http://localhost:8000
```

Setup is done. You won't need to repeat any of the above unless you delete the project or your `venv`/`node_modules` folders.

---

## Running it every day (3 terminals)

### Terminal 1 — Database
```bash
cd kiko-ai
docker compose up -d
```
Verify it's running:
```bash
docker ps
```
You should see `kiko-mongodb` and `kiko-mongo-express` listed.

### Terminal 2 — Backend
```bash
cd kiko-ai/backend
venv\Scripts\activate
uvicorn app.main:app --reload
```
*(Mac/Linux instead of the activate line: `source venv/bin/activate`)*

Confirm it's working by visiting: **http://localhost:8000/docs**

### Terminal 3 — Frontend
```bash
cd kiko-ai/frontend
npm run dev
```
Open the app at: **http://localhost:5173**

---

## Loading the MindGuard Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `kiko-ai/extension` folder
5. Click the KIKO icon in your Chrome toolbar, log in with the same account you use on the web app
6. Start a study session from the web dashboard — the extension should show "MindGuard Active"

---

## Useful URLs while everything is running

| What | URL |
|---|---|
| The app itself | http://localhost:5173 |
| Backend API interactive docs | http://localhost:8000/docs |
| Backend health check | http://localhost:8000/ |
| MongoDB visual browser (mongo-express) | http://localhost:8081 |

---

## Shutting down

Stop the backend and frontend with **Ctrl+C** in their terminals.

Stop the database (your data is kept, not deleted):
```bash
cd kiko-ai
docker compose down
```

Next time you run `docker compose up -d`, all your users, sessions, and uploaded documents will still be there.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `docker compose up -d` fails / hangs | Make sure Docker Desktop is actually open and fully started first |
| Backend can't connect to MongoDB | Run `docker ps` — if `kiko-mongodb` isn't listed as running, run `docker compose up -d` again |
| `uvicorn: command not found` or import errors | Your virtual environment isn't activated — re-run the `venv\Scripts\activate` command in that terminal |
| Frontend loads but shows network errors / blank data | Check the backend terminal for errors, and confirm `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8000` |
| "Port already in use" error | Something is already using port 8000, 5173, or 27017 — close old leftover terminals from a previous run, or restart your computer |
| First PDF upload / AI feature is slow | Normal — the AI embedding model downloads once (~90MB) the first time it's used |
| Extension shows "Disconnected" or won't track | Make sure the backend is running on port 8000, and that you logged into the extension popup with a valid account |
| Dependency/import errors after a fresh `pip install` | Re-run `pip install -r requirements.txt` — the versions in that file are the ones known to work together |

---

## Quick command cheat-sheet (copy-paste block)

```bash
# Every day, in 3 separate terminals:

# Terminal 1
cd kiko-ai && docker compose up -d

# Terminal 2
cd kiko-ai/backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Terminal 3
cd kiko-ai/frontend && npm run dev
```