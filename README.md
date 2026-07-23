# Lucy - AI Study Assistant

An AI-powered tutoring assistant for Brazilian ENEM exam preparation. Lucy helps students across 16 subjects with real-time chat, web search, calculations, notes, and personalized study plans.

## Tech Stack

- **Frontend:** React 19, Vite 8, TypeScript 6, Tailwind CSS 4, Zustand
- **Backend:** Fastify 5, Drizzle ORM, PostgreSQL (pgvector)
- **AI:** Groq (Llama 3.3 70B) for chat, Gemini for embeddings
- **Deploy:** Vercel (frontend) + Railway (backend + database)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 17+ (or use Railway)
- Groq API key ([get one here](https://console.groq.com))
- Gemini API key ([get one here](https://aistudio.google.com))

### Backend

```bash
cd server
cp .env.example .env
# Edit .env with your API keys
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### Frontend

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

The app runs at `http://localhost:5173` (frontend) and `http://localhost:3333` (API).

## Project Structure

```
lucy/
├── client/          # React SPA (Vite)
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # React hooks
│       ├── lib/          # API client, WebSocket, utils
│       ├── store/        # Zustand stores
│       └── types/        # TypeScript types
└── server/          # Fastify API
    └── src/
        ├── db/           # Drizzle schema + migrations
        ├── lib/          # Auth, JWT, WebSocket, LLM, tools
        ├── routes/       # API route handlers
        ├── services/     # Business logic
        └── env.ts        # Environment validation
```

## API

Documentation available at `/docs` when the server is running.

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `GROQ_API_KEY` | Yes | Groq API key for LLM |
| `GEMINI_API_KEY` | No | Gemini API key for embeddings |
| `CORS_ORIGIN` | No | Allowed origin (default: `*`) |
| `PORT` | No | Server port (default: `3333`) |
| `NODE_ENV` | No | `development` or `production` |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API URL (default: `http://localhost:3333`) |
| `VITE_WS_URL` | No | WebSocket URL (default: derived from API_URL) |

## License

Private
