# Momentum API — NestJS Backend

Implementation of the Momentum v1 API Specification, Database Schema & ER Design, and Technical Architecture docs. Pairs with the `momentum-web` frontend (point its `NEXT_PUBLIC_API_URL` at this server).

## Run it

```bash
npm install
cp .env.example .env          # adjust JWT_SECRET etc.
npm run db:up                 # starts Postgres 16 via Docker
npm run prisma:migrate        # creates the schema (prompts for a migration name)
npm run prisma:seed           # demo user: arjun@momentum.app / momentum123
npm run start:dev             # http://localhost:3000/api/v1
```

Node 18+, Docker (or any Postgres 16 with DATABASE_URL set).

## Contract compliance

- **Base path** `/api/v1`, REST, versioned. Breaking changes go to `/v2`.
- **Envelope**: every success → `{ success: true, data, message: "Success" }`; every error → `{ success: false, error: { code, message } }` with spec codes (`TASK_NOT_FOUND`, `UNAUTHORIZED`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, `SYNC_CONFLICT`, …). Implemented once via a global interceptor + exception filter.
- **Auth**: JWT Bearer access tokens (15m) + refresh rotation (30d). Reuse of a rotated refresh token revokes the session. `/auth/register`, `/login`, `/refresh`, `/logout` are live; `/auth/apple` and `/auth/google` return `OAUTH_NOT_CONFIGURED` until provider credentials are added (verification flow documented in `auth.module.ts`).
- **Rate limits** per the spec: 100 req/min default, 20 req/min on `/ai/*`, 10 req/min on `/auth/*` (`@nestjs/throttler`).
- **Endpoints**: users, life-areas, goals (status/lifeArea/priority filters), projects, tasks (incl. `POST /tasks/{id}/complete` → `{momentumPoints}`), habits (incl. `POST /habits/{id}/complete` → `{streak, points}`, `GET /habits/{id}/logs`), journal (incl. `POST /journal/{id}/reflect` → `{summary}`), calendar (+`/calendar/sync`), planner (daily/weekly/monthly), focus (`/focus/start`, `/focus/end`), momentum-score (`{today, weekly, monthly}` + history), insights, ai (chat, daily-brief, weekly/monthly reviews, goal-roadmap, habit suggestions, reflection), notifications, search (universal), settings, widgets/dashboard.

## Database (Prisma → PostgreSQL)

`prisma/schema.prisma` encodes the schema doc: UUID PKs, soft deletes (`deleted_at`), audit timestamps, FK constraints with cascade rules, snake_case plural tables, and the indexing strategy including composites (`(user_id, status)`, `(user_id, due_date)`, `(habit_id, completed_at)`, …). Tables: users, life_areas, goals, milestones, projects, tasks, habits, habit_logs, journal_entries, calendar_events, focus_sessions, reflections, ai_conversations, ai_messages, momentum_scores (append-only history with source attribution), achievements, notifications, user_settings.

## Momentum Score™ semantics

Score is an append-only ledger (`momentum_scores`), never a mutable counter. Completing a task/habit/journal/focus session writes a positive entry with `source_type`/`source_id`; reopening a task writes a negative correction. `GET /momentum-score` aggregates today / weekly avg / monthly avg from the ledger — matching "consistency over perfection."

## AI layer

`AiProviderService` implements the pipeline from the architecture doc: **Context Builder** (reads the user's tasks, habits, goals, calendar, score) → **Prompt Engine** (coach persona: strategic, calm, honest, encouraging — never manipulative or judgmental) → **LLM**. OpenAI is the primary provider when `OPENAI_API_KEY` is set; a deterministic context-aware local coach keeps every `/ai/*` endpoint functional without credentials. Conversations persist to `ai_conversations` / `ai_messages`. Swap or add providers behind the same interface.

## Engineering standards

Feature-based modules (one file per feature: controller + service + module), dependency injection throughout, class-validator DTOs, strict typing, global guards. Structure:

```
src/
├── main.ts                  # /api/v1 prefix, CORS, validation, envelope, error filter
├── app.module.ts            # wiring + global JWT guard + throttler
├── common/                  # envelope interceptor, error filter, ApiException, auth guard
├── prisma/                  # PrismaService (global)
└── features/                # auth, users, life-areas, goals, projects, tasks, habits,
                             # journal, calendar, planner, focus, momentum-score,
                             # ai (+ ai-provider.service), misc (insights/notifications/
                             # search/settings/widgets)
```

## Connect the web app

In `momentum-web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```
Run the web app on another port (`npm run dev -- -p 3001`) since the API defaults to 3000. Log in via the seeded account and the frontend's sync queue starts mirroring mutations here.

## Not yet wired (per roadmap phases)

- Apple/Google OAuth verification (needs provider credentials), external calendar/health integrations, APNs/Web Push delivery, Redis caching + background workers, Sentry/OpenTelemetry/Prometheus, file uploads. Reserved future tables (teams, shared_goals, subscriptions, …) intentionally not created yet.
