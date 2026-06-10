<h1 align="center">tiny-link</h1>

<p align="center">
  A URL shortener with click analytics — a fast synchronous redirect hot-path
  next to asynchronous click aggregation over a real queue, with rate limiting,
  idempotent rollups and graceful shutdown.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/backend-NestJS-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/frontend-React%2019-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/database-PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/queue-BullMQ%20%2B%20Redis-DC382D?logo=redis&logoColor=white" alt="BullMQ + Redis" />
</p>

---

## What is tiny-link?

A user signs up (JWT auth), shortens a long URL and gets back a short code.
Anyone hitting `GET /:code` is redirected to the original URL — that endpoint
is the hot path: Redis-cached, rate-limited, and it never waits on analytics.
Each redirect fires a click job onto a BullMQ queue and returns immediately.
A separate worker consumes the jobs, buffers them, bulk-inserts raw click
events and periodically rolls them up into daily aggregates that power the
analytics dashboard.

The project is deliberately built around the hard parts of backend concurrency:

| Feature | What's behind it |
|---|---|
| **Short links** | Collision-safe short code generation (nanoid), per-user link management |
| **Redirect hot path** | Redis cache in front of Postgres, Redis-backed rate limiting, fire-and-forget click tracking |
| **Click analytics** | BullMQ producer/consumer, batched bulk inserts, ordered batch commits |
| **Daily rollups** | Repeatable job with an idempotent cursor, atomic upserts, `RepeatableRead` + retry on serialization conflicts |
| **Auth** | JWT (passport-jwt), argon2 password hashing |
| **Resilience** | Graceful shutdown that drains the click buffer; survives Redis going down mid-flight |
| **Dashboard** | React SPA — auth, link CRUD, per-link click charts (recharts) |

## Tech stack

- **Backend** — NestJS 10, TypeScript strict mode, two entrypoints (API + worker) from one codebase
- **Data** — PostgreSQL 16 via Prisma; raw SQL for the concurrency hot-spots (bulk insert, atomic upsert, `FOR UPDATE` cursor)
- **Queue** — BullMQ over Redis: clicks queue + repeatable rollup job
- **Validation** — Zod for HTTP DTOs, env config and job payloads
- **Frontend** — React 19, Vite, Tailwind CSS 4, TanStack Query, React Router, Recharts
- **Testing** — Jest split into unit / integration / e2e projects, Testcontainers for real Postgres + Redis

## Repository layout

```
.
├── backend/             # NestJS — API and worker share one codebase
│   ├── src/modules/
│   │   ├── auth/        # JWT auth: register, login, guards
│   │   ├── links/       # Link CRUD, short code generation
│   │   ├── redirect/    # GET /:code hot path — cache, rate limit, click producer
│   │   ├── clicks/      # Worker side — batching consumer, bulk inserts
│   │   ├── rollup/      # Repeatable job — raw events → daily aggregates
│   │   └── analytics/   # Analytics REST API for the dashboard
│   ├── src/main.api.ts      # API entrypoint
│   ├── src/main.worker.ts   # Worker entrypoint
│   └── prisma/          # Schema + migrations
├── frontend/            # React SPA — auth, links, click analytics
├── docs/                # Spec, architecture, data model, API, queues + ADRs
└── Makefile             # One-command local dev
```

## Architecture

```
                 ┌─────────────┐  cache / rate-limit   ┌─────────┐
  GET /:code ──► │     API     │ ◄───────────────────► │  Redis  │
                 │  (NestJS)   │ ──── click job ─────► │ (BullMQ)│
                 └──────┬──────┘                       └────┬────┘
                        │ CRUD / analytics                  │ consume
                        ▼                                   ▼
                 ┌─────────────┐   bulk insert       ┌─────────────┐
                 │ PostgreSQL  │ ◄────────────────── │   Worker    │
                 │             │ ◄── daily rollup ── │  (NestJS)   │
                 └─────────────┘                     └─────────────┘
```

The redirect path answers from cache and enqueues; it never blocks on the
database for analytics. The worker buffers click jobs and flushes them in
order as bulk inserts; a repeatable rollup job walks raw events with an
idempotent cursor and upserts daily aggregates atomically.

## Running locally

### Prerequisites

- Node.js 20+, Docker

### One command

```bash
make install   # npm install in backend + frontend (first time)
make run       # starts Postgres + Redis containers, runs migrations,
               # then launches api + worker + web with prefixed logs
```

- API — http://localhost:3001
- Web — http://localhost:5173

`Ctrl+C` stops everything. Postgres runs in Docker on port `5434`
(`tinylink-postgres-dev`), Redis on `6379`.

### Manually

```bash
cd backend
npm run prisma:migrate       # apply migrations
npm run start:api:dev        # API with watch
npm run start:worker:dev     # worker with watch (separate terminal)

cd frontend
npm run dev                  # Vite dev server, proxies /api to the backend
```

### Tests

```bash
cd backend
npm test                     # unit
npm run test:integration     # real Postgres + Redis via Testcontainers
npm run test:e2e             # full API + worker flows
```

## Documentation

Design docs live in [`docs/`](docs/): spec, architecture, data model, API
contract, queue design — and [`docs/adr/`](docs/adr/) records the "why"
behind the key decisions (short code generation, raw-events-plus-rollup
analytics, API/worker split, JWT auth, the data access stack).
