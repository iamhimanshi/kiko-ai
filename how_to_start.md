# HOW_TO_START.md — KIKO AI

A complete reference for setting up and running the KIKO AI project. Keep this file at the root of the `kiko-ai` project folder.

---

## What this project is

KIKO AI is a study companion with two parts:
- **Study Assistant** — upload PDFs, get AI summaries, flashcards, quizzes, and a chat-based AI Tutor
- **MindGuard** — a Chrome extension that tracks study sessions and warns you when your browsing drifts off-goal

**Stack:** React + Vite + Tailwind (frontend) · FastAPI + Python (backend) · PostgreSQL via Docker (database) · Groq (AI) · Chrome Extension Manifest V3 (MindGuard)

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
2. Start PostgreSQL with Docker
bash
docker-compose up -d
This starts:

PostgreSQL on port 5432

Backend on port 8000

3. Set up the backend
bash
cd backend
python -m venv venv
Activate the virtual environment:

bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
Install dependencies:

bash
pip install -r requirements.txt
Create your environment file:

bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
Now open backend/.env in a text editor and fill in:

env
# Database - PostgreSQL (running in Docker)
DATABASE_URL=postgresql://kiko_user:kiko_password@postgres:5432/kiko_db

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
Important:

DATABASE_URL uses postgres as the hostname because PostgreSQL runs inside Docker

JWT_SECRET - use any long random string (e.g., openssl rand -hex 32)

GROQ_API_KEY - get from https://console.groq.com

4. Set up the frontend
Open a new terminal window, then:

bash
cd kiko-ai/frontend
npm install
Create frontend/.env:

env
VITE_API_BASE_URL=http://localhost:8000
5. Build and start everything
From the project root:

bash
# Stop everything if running
docker-compose down

# Rebuild backend with new dependencies
docker-compose build --no-cache backend

# Start everything
docker-compose up -d
6. Verify everything is running
bash
# Check containers
docker-compose ps

# You should see:
# - kiko-postgres (healthy)
# - kiko-backend (running)

# Test backend
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Test root
curl http://localhost:8000/
# Should return: {"message":"KIKO AI API","status":"running"}
Setup is done. You won't need to repeat any of the above unless you delete the project or your venv/node_modules folders.

Running it every day (2 terminals)
Terminal 1 — Backend + Database (via Docker)
Everything runs inside Docker - PostgreSQL + Backend together.

bash
cd kiko-ai
docker-compose up -d
Check logs:

bash
docker-compose logs -f backend
You should see:

text
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
Terminal 2 — Frontend
bash
cd kiko-ai/frontend
npm run dev
Open the app at: http://localhost:5173

Alternative: Run Backend Locally, PostgreSQL in Docker
If you prefer faster development with hot-reload:

Terminal 1 — Database only
bash
cd kiko-ai
docker-compose up -d postgres
Terminal 2 — Backend (local)
bash
cd kiko-ai/backend
venv\Scripts\activate
uvicorn app.main:app --reload
Terminal 3 — Frontend
bash
cd kiko-ai/frontend
npm run dev
Useful URLs while everything is running
What	URL
The app itself	http://localhost:5173
Backend API interactive docs	http://localhost:8000/docs
Backend health check	http://localhost:8000/health
Backend root	http://localhost:8000/
Loading the MindGuard Chrome Extension
Open Chrome and go to chrome://extensions

Turn on Developer mode (top-right toggle)

Click Load unpacked

Select the kiko-ai/extension folder

Click the KIKO icon in your Chrome toolbar, log in with the same account you use on the web app

Start a study session from the web dashboard — the extension should show "MindGuard Active"

Shutting down
Stop the frontend with Ctrl+C in its terminal.

Stop all Docker containers:

bash
cd kiko-ai
docker-compose down
Your data is preserved in the PostgreSQL volume. Next time you run docker-compose up -d, all your users, sessions, and uploaded documents will still be there.

Troubleshooting
Problem	Fix
docker-compose up -d fails / hangs	Make sure Docker Desktop is actually open and fully started first
Backend can't connect to PostgreSQL	Run docker ps — if kiko-postgres isn't listed as running, run docker-compose up -d again
ModuleNotFoundError: No module named 'sqlalchemy'	Rebuild: docker-compose build --no-cache backend
The asyncio extension requires an async driver	Your DATABASE_URL must use postgresql+asyncpg:// — check backend/app/core/database.py
uvicorn: command not found	Your virtual environment isn't activated — re-run venv\Scripts\activate
Frontend loads but shows network errors / blank data	Check the backend terminal for errors, confirm frontend/.env has VITE_API_BASE_URL=http://localhost:8000
"Port already in use" error	Something is already using port 8000, 5173, or 5432 — close old terminals or restart your computer
First PDF upload / AI feature is slow	Normal — the AI embedding model downloads once (~90MB) the first time it's used
Extension shows "Disconnected" or won't track	Make sure the backend is running on port 8000, and that you logged into the extension popup with a valid account
Dependency/import errors after a fresh pip install	Re-run pip install -r requirements.txt — the versions in that file are the ones known to work together
ImportError: cannot import name 'users_collection'	Your service files are still using MongoDB. Delete and replace with PostgreSQL versions from the architecture plan
Database Management
View PostgreSQL logs
bash
docker-compose logs -f postgres
Access PostgreSQL inside container
bash
docker exec -it kiko-postgres psql -U kiko_user -d kiko_db
Reset database (delete all data)
bash
docker-compose down -v
docker-compose up -d
Quick command cheat-sheet (copy-paste block)
bash
# Every day, in 2 separate terminals:

# Terminal 1 — Everything in Docker
cd kiko-ai && docker-compose up -d

# Terminal 2 — Frontend
cd kiko-ai/frontend && npm run dev
OR (if running backend locally):

bash
# Terminal 1 — Database only
cd kiko-ai && docker-compose up -d postgres

# Terminal 2 — Backend (local)
cd kiko-ai/backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Terminal 3 — Frontend
cd kiko-ai/frontend && npm run dev