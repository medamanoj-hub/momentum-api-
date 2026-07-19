# Momentum — Web (Phase 1 · Core App)

AI-powered Life Operating System. Next.js implementation of the Momentum PRD (doc pages 1–70), feature-equivalent to the mobile app for Phase 1 and matching the reference design system.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Node 18+ required.

## What's implemented

| Pillar | Route | Notes |
|---|---|---|
| Dashboard | `/dashboard` | Momentum Score ring + weekly sparkline, AI Daily Brief, calendar timeline, life areas grid, Today's Mission, checkable tasks, tappable habit rings, focus timer card, achievements |
| Life | `/life`, `/life/[area]` | All 9 areas · Overview / Goals / Habits / Journal / Analytics tabs per area (consistent structure per the IA) |
| Planner | `/planner` | Day timeline with time blocks + live "now" line, task manager with add-task and area tagging |
| AI Coach | `/coach` | Daily Brief + interactive chat with suggested actions (Start Focus Session, etc.) |
| Focus Mode | `/focus` | Working 25/45/60/90-minute countdown, task attachment, awards Momentum points on completion |
| Insights | `/insights` | Score history, habit streaks, life balance index, area breakdown, achievements |
| Profile | `/profile` | Identity, level ring, settings, reset demo data |
| Search | `/search` | Universal search across tasks, goals, habits, journal, calendar, life areas (GET /search) |
| Landing | `/` | Public marketing homepage with features, philosophy, and CTAs; footer links to legal pages |
| Legal | `/privacy`, `/terms` | Plain-language Privacy Policy and Terms of Service |
| Password reset | `/forgot-password`, `/reset-password` | Full email-based reset flow against /auth/forgot-password and /auth/reset-password |
| Auth | `/login` | REAL when NEXT_PUBLIC_API_URL is set: register/login store JWTs, the store then boots from the server (`src/lib/remote-state.ts`) and mutations sync via the queue. Guest mode (browser-only) remains available. |
| Onboarding | `/onboarding` | 6-step flow per UX spec (name → goals → area ratings → habits → schedule → AI summary) |
| Quick Capture | global (sidebar) | Captures a task from anywhere; keyword auto-categorization stands in for AI filing |

Momentum Score is live: completing tasks, habits, journal entries, and focus sessions updates the score (and undoing removes points). State persists offline-first in `localStorage`.

## Architecture (matches the Technical Architecture, DB Schema & API Specification docs)

- **v1 API client** (`src/lib/client.ts`): full typed implementation of the REST contract — base URL `https://api.momentum.app/v1` (or `http://localhost:3000/api/v1` in dev), Bearer auth with refresh-token rotation on 401, the standard `{success, data, message}` / `{success, false, error: {code, message}}` envelope, `ApiError` with contract error codes (TASK_NOT_FOUND, RATE_LIMIT_EXCEEDED, AI_PROVIDER_UNAVAILABLE, …), and every endpoint group: auth, users, life-areas, goals, projects, tasks (incl. `POST /tasks/{id}/complete` → `{momentumPoints}`), habits (incl. `POST /habits/{id}/complete` → `{streak, points}`), journal (+ `/journal/{id}/reflect`), calendar (+ `/calendar/sync`), planner, focus (`/focus/start`, `/focus/end`), momentum-score (+ history), insights, ai (chat, daily/weekly/monthly reviews, goal-roadmap, habit suggestions, reflection), notifications, search, settings, widgets. DTOs mirror the database schema entities.
- **Offline-first sync** (`src/lib/sync.ts`): implements the doc's pipeline — Local DB → Sync Queue → API → PostgreSQL. Every mutation applies locally first, then mirrors to the backend; failed calls persist in a localStorage queue and retry on reconnect. Unrecoverable 4xx ops are dropped; 429/5xx/offline are retried, matching the rate-limit rules (100/min default, 20/min AI, 10/min auth).
- **Backend toggle**: set `NEXT_PUBLIC_API_URL` (see `.env.example`) to enable server sync. Unset, the app runs fully offline against the `LocalAdapter` — no behavior change in the UI either way.
- **AI as a layer**: `askCoach()` posts to `POST /ai/chat` when a backend is configured and transparently falls back to the local context-aware heuristic when offline or when the provider is unavailable.
- **Modular**: tasks / habits / goals / journal / calendar / analytics are separate slices of a typed state (`src/lib/types.ts`), managed in `src/lib/store.tsx`.
- **Design tokens** in `tailwind.config.ts` mirror the reference UI: deep navy background, indigo→violet gradient accent, per-area tint system, ring + sparkline components.

## Accessibility & quality floor

Dark theme with WCAG-conscious contrast, visible keyboard focus rings, `prefers-reduced-motion` respected, responsive from mobile (bottom nav) to desktop (sidebar), loading/empty/error copy per the UX spec.

## Remaining backend-dependent work

- Stand up the NestJS backend implementing this contract (the client and sync queue are ready)
- Live auth flows (Sign in with Apple / Google OAuth redirect handling)
- Calendar & Health integrations (`/integrations/*` endpoints)
- Web Push notifications (delivery layer per the notification architecture)
- Optional: swap the ad-hoc fetch layer for TanStack Query once server state is live
