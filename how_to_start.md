# HOW_TO_START.md — KIKO AI

A complete reference for setting up and running the KIKO AI project. Keep this file at the root of the `kiko-ai` project folder.

---

## What this project is

KIKO AI is a study companion with two parts:
- **Study Assistant** — upload PDFs, get AI summaries, flashcards, quizzes, and a chat-based AI Tutor
- **MindGuard** — a Chrome extension that tracks study sessions and warns you when your browsing drifts off-goal

**Stack:** React + Vite + Tailwind (frontend) · FastAPI + Python (backend) · PostgreSQL via Docker (database) · Groq / Gemini (AI) · Chrome Extension Manifest V3 (MindGuard)

The backend and database both run inside Docker (via `docker-compose`), so day-to-day you're mainly starting Docker + the frontend.

---

## Prerequisites (install once, if you don't already have them)

| Tool | Check if installed | Get it |
|---|---|---|
| Python 3.10+ (only needed if you ever run the backend locally instead of in Docker) | `python --version` | https://www.python.org/downloads/ |
| Node.js 18+ | `node --version` | https://nodejs.org/ |
| Docker Desktop | Open the app, confirm it launches | https://www.docker.com/products/docker-desktop/ |
| A Groq API key | — | Free at https://console.groq.com |
| A Gemini API key (optional, second AI provider) | — | https://aistudio.google.com/apikey |

---

## First-time setup (do this once)

### 1. Unzip the project and enter it
```bash
cd kiko-ai
```

### 2. Configure the backend environment
```bash
cd backend
```
Create your environment file:
```bash
copy .env.example .env
```
*(Mac/Linux instead: `cp .env.example .env`)*

Open `backend/.env` and fill in:
```env
# Database - PostgreSQL (running in Docker)
DATABASE_URL=postgresql+asyncpg://kiko_user:kiko_password@postgres:5432/kiko_db

# Auth
JWT_SECRET=any_long_random_string_you_make_up
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI providers
GROQ_API_KEY=your_actual_groq_key_here
GEMINI_API_KEY=your_gemini_key_here

# CORS
CORS_ORIGINS=http://localhost:5173

# Uploads
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=10
```

**Important:**
- `DATABASE_URL` uses `postgres` as the hostname (not `localhost`) because from inside the Docker network, the Postgres container's hostname is `postgres`.
- Use the `postgresql+asyncpg://` prefix — the async driver, not plain `postgresql://` — or the backend will fail to connect.
- `JWT_SECRET` — any long random string works, e.g. generate one with `openssl rand -hex 32`.

### 3. Set up the frontend
Open a **new terminal window**, then:
```bash
cd kiko-ai/frontend
npm install
copy .env.example .env
```
*(Mac/Linux instead: `cp .env.example .env`)*

Confirm `frontend/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Build and start everything (backend + database)
From the project root:
```bash
cd kiko-ai
docker-compose build --no-cache backend
docker-compose up -d
```

### 5. Verify everything is running
```bash
docker-compose ps
```
You should see:
- `kiko-postgres` — healthy
- `kiko-backend` — running

Test the backend:
```bash
curl http://localhost:8000/health
```
Should return `{"status":"healthy"}`.

```bash
curl http://localhost:8000/
```
Should return `{"message":"KIKO AI API","status":"running"}`.

Setup is done. You won't need to repeat any of the above unless you delete the project, wipe your Docker volumes, or delete `frontend/node_modules`.

---

## Running it every day

### The normal way — everything in Docker (2 terminals)

**Terminal 1 — Backend + Database**
```bash
cd kiko-ai
docker-compose up -d
```
Watch the logs to confirm it started cleanly:
```bash
docker-compose logs -f backend
```
Look for:
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Frontend**
```bash
cd kiko-ai/frontend
npm run dev
```
Open the app at: **http://localhost:5173**

### Alternative — faster dev loop (backend runs locally with hot-reload, only Postgres in Docker)

Use this if you're actively editing backend code and don't want to rebuild the Docker image every time.

**Terminal 1 — Database only**
```bash
cd kiko-ai
docker-compose up -d postgres
```

**Terminal 2 — Backend (local, with `--reload`)**
```bash
cd kiko-ai/backend
venv\Scripts\activate
uvicorn app.main:app --reload
```
*(Mac/Linux instead of the activate line: `source venv/bin/activate` — if you don't have a `venv` yet, create one first: `python -m venv venv`, then `pip install -r requirements.txt`)*

With this option, your `.env`'s `DATABASE_URL` hostname needs to be `localhost` instead of `postgres` (since the backend isn't inside the Docker network anymore) — keep a second `.env` value handy, or just swap the hostname when you switch modes.

**Terminal 3 — Frontend**
```bash
cd kiko-ai/frontend
npm run dev
```

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
| Backend health check | http://localhost:8000/health |
| Backend root | http://localhost:8000/ |

---

## Database management

**View PostgreSQL logs**
```bash
docker-compose logs -f postgres
```

**Access PostgreSQL directly inside the container**
```bash
docker exec -it kiko-postgres psql -U kiko_user -d kiko_db
```
Useful psql commands once inside: `\dt` (list tables), `\d table_name` (describe a table), `\q` (quit).

**Reset the database (deletes all data)**
```bash
docker-compose down -v
docker-compose up -d
```
The `-v` flag removes the Docker volume, which is where Postgres data actually lives — only do this if you genuinely want a clean slate.

---

## Shutting down

Stop the frontend with **Ctrl+C** in its terminal.

Stop all Docker containers:
```bash
cd kiko-ai
docker-compose down
```
Your data is preserved in the PostgreSQL volume (as long as you don't add `-v`). Next time you run `docker-compose up -d`, all your users, sessions, and uploaded documents will still be there.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `docker-compose up -d` fails / hangs | Make sure Docker Desktop is actually open and fully started first |
| Backend can't connect to PostgreSQL | Run `docker ps` — if `kiko-postgres` isn't listed as running, run `docker-compose up -d` again |
| `ModuleNotFoundError: No module named 'sqlalchemy'` | Your Docker image is stale — rebuild: `docker-compose build --no-cache backend` |
| `The asyncio extension requires an async driver` | Your `DATABASE_URL` must use `postgresql+asyncpg://`, not plain `postgresql://` — check `backend/app/core/database.py` and your `.env` |
| `uvicorn: command not found` (local mode only) | Your virtual environment isn't activated — re-run `venv\Scripts\activate` |
| Frontend loads but shows network errors / blank data | Check the backend terminal/logs for errors, and confirm `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8000` |
| "Port already in use" error | Something is already using port 8000, 5173, or 5432 — close old terminals/containers or restart your computer |
| First PDF upload / AI feature is slow | Normal — the AI embedding model downloads once (~90MB) the first time it's used |
| Extension shows "Disconnected" or won't track | Make sure the backend is running on port 8000, and that you logged into the extension popup with a valid account |
| `ImportError: cannot import name 'users_collection'` | Leftover MongoDB-era code somewhere still being imported — that function belongs to the old Mongo setup and should no longer exist; search the codebase for stray references to it |
| Dependency/import errors after a fresh `pip install` (local mode) | Re-run `pip install -r requirements.txt` — the versions pinned there are the ones known to work together |

---

## Quick command cheat-sheet (copy-paste block)

**Everyday — Docker mode:**
```bash
# Terminal 1
cd kiko-ai && docker-compose up -d

# Terminal 2
cd kiko-ai/frontend && npm run dev
```

**Everyday — local backend hot-reload mode:**
```bash
# Terminal 1 — database only
cd kiko-ai && docker-compose up -d postgres

# Terminal 2 — backend
cd kiko-ai/backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Terminal 3 — frontend
cd kiko-ai/frontend && npm run dev
```