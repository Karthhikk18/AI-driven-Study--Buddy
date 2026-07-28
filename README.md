# 🧠 AI Study Buddy OS

A full-stack AI-powered study platform with RAG chat, flashcards, quizzes, concept mind maps, focus flow, gamification, and more.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Buddy AI Chat** | RAG-grounded answers from your uploaded documents |
| 📚 **Knowledge Vault** | Upload PDFs, images, links — auto-OCR processed |
| ⚡ **Flashcards** | SM-2 spaced repetition algorithm |
| 📝 **Quiz & Practice** | Document-grounded quizzes |
| 🧠 **AI Mind Map** | Interactive concept graph from your notes |
| ⏱️ **Focus Flow** | Immersive Pomodoro + Web Audio ambient sounds |
| 🔥 **Study Battle** | Gamified timed quiz with combo XP & sound FX |
| 📊 **Analytics** | Exam readiness score, activity heatmap, streak |
| 🎯 **Subject Insights** | AI-powered sidebar summaries + quick actions |
| 📓 **Study Planner** | Task manager with Kanban / list / calendar views |

---

## 🚀 Deployment

### Option A: Vercel (Frontend) + Railway (Backend) — Recommended

#### Step 1 — Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/study-buddy.git
git push -u origin main
```

#### Step 2 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repository
3. Railway auto-detects Python via `Procfile`
4. In **Settings → Variables**, add:
   ```
   GEMINI_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here   (optional)
   PORT=8000                       (Railway sets this automatically)
   ```
5. In **Settings → Networking**, click **Generate Domain** → copy your URL
   Example: `https://study-buddy-production.up.railway.app`
6. Add a **Persistent Volume** (optional but recommended for SQLite data):
   - Volume path: `/app/backend`

#### Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo
2. Vercel auto-detects `vercel.json`
3. In **Environment Variables**, add:
   ```
   VITE_API_URL=https://study-buddy-production.up.railway.app
   ```
4. Click **Deploy** — your app goes live at `https://your-app.vercel.app`

#### Step 4 — Set up Auto-Deploy via GitHub Actions (optional)

Add these secrets to your GitHub repo (`Settings → Secrets → Actions`):

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | vercel.com → Your project's `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | vercel.com → Your project's `.vercel/project.json` |
| `VITE_API_URL` | Your Railway backend URL |

Now every push to `main` auto-builds and deploys! ✅

---

### Option B: Render (Both on one platform)

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo → Render reads `render.yaml`
3. Set env vars: `GEMINI_API_KEY`, `OPENAI_API_KEY`
4. Deploy — backend gets a URL, deploy frontend separately as a **Static Site**
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Env var: `VITE_API_URL=https://your-render-backend.onrender.com`

---

## 🛠️ Local Development

```bash
# 1. Start backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app/server.py

# 2. Start frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Environment Variables

Copy `.env.example` → `.env` in the project root and add your API keys:

```env
GEMINI_API_KEY="your_gemini_key"
OPENAI_API_KEY="your_openai_key"   # optional
```

---

## 🏗️ Architecture

```
Study-Buddy/
├── backend/
│   ├── app/
│   │   ├── server.py          # Main HTTP server (stdlib only)
│   │   ├── ai/                # LLM provider, prompts, agent
│   │   ├── rag/               # Vector store (FAISS) + retriever
│   │   ├── document_engine/   # PDF/image/link parsers
│   │   └── ocr/               # Tesseract OCR pipeline
│   ├── storage/               # Uploaded files + exports
│   └── study_buddy.db         # SQLite database
├── frontend/
│   └── src/
│       ├── pages/             # Dashboard, Chat, Flashcards, MindMap, Battle...
│       ├── components/        # Sidebar, Header, FocusFlow, Heatmap...
│       ├── services/api.ts    # Axios API client
│       └── store/useStore.ts  # Zustand state management
├── vercel.json                # Vercel SPA config
├── railway.toml               # Railway deployment config
├── Procfile                   # Process definition
└── requirements.txt           # Python dependencies
```

---

## 📄 License

MIT — built with ❤️ using Python stdlib + React + TypeScript + TailwindCSS
