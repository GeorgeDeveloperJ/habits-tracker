# 🐳 Docker Infrastructure

This document describes the containerized development environment introduced in the `feat/dockerize-env` branch and details every change it makes relative to the `dev` branch.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Repository File Structure](#2-repository-file-structure)
3. [Services](#3-services)
   - [db (PostgreSQL)](#31-db--postgresql)
   - [backend](#32-backend)
   - [frontend](#33-frontend)
4. [Environment Variables](#4-environment-variables)
5. [Dev Entrypoint Script](#5-dev-entrypoint-script)
6. [Production Dockerfile](#6-production-dockerfile-backendDockerfile)
7. [Volume Strategy](#7-volume-strategy)
8. [Changes vs `dev` Branch](#8-changes-vs-dev-branch)
9. [Quick Start](#9-quick-start)

---

## 1. Overview

The `feat/dockerize-env` branch wraps the entire stack — **PostgreSQL**, **Express/Node.js backend**, and **React/Vite frontend** — in a single `docker-compose.yml` at the repository root.

The goal of this environment is **local development parity**: every developer gets the same database, the same Node version, and the same startup sequence without installing Postgres or running migrations manually.

> [!IMPORTANT]
> This Docker setup targets **development only**. The `docker-compose.yml` uses `Dockerfile.dev` images for both the backend and frontend, which include hot-reloading and are **not** hardened for production.
> A separate production `Dockerfile` exists for the backend (see [Section 6](#6-production-dockerfile-backendDockerfile)).

---

## 2. Repository File Structure

The following files were added by this branch (all new relative to `dev`):

```
habits-tracker/
├── .env                          # Root env — Postgres credentials for the db service
├── docker-compose.yml            # Orchestrates all 3 services
│
├── backend/
│   ├── .dockerignore             # Excludes node_modules, dist, .env from build context
│   ├── Dockerfile                # Multi-stage production build (builder + production)
│   ├── Dockerfile.dev            # Dev image — runs entrypoint.js
│   └── scripts/
│       └── entrypoint.js         # Runs migrations → seeds → starts dev server
│
└── frontend/
    ├── .dockerignore             # Excludes node_modules, dist, .env from build context
    └── Dockerfile.dev            # Dev image — runs `vite --host`
```

---

## 3. Services

The `docker-compose.yml` defines three services that start together via `docker compose up`.

### 3.1 `db` — PostgreSQL

```yaml
db:
  image: postgres:17-alpine
  container_name: habits-db
  restart: unless-stopped
  env_file:
    - .env                        # Reads POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

| Property | Value | Notes |
|---|---|---|
| **Image** | `postgres:17-alpine` | Lightweight Alpine-based Postgres 17 |
| **Container name** | `habits-db` | Fixed name for predictability |
| **Credentials** | Read from root `.env` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` |
| **Persistence** | `postgres_data` named volume | Data survives container restarts |
| **Health check** | `pg_isready` | Backend waits for this before starting |

> [!NOTE]
> The `backend` service declares `depends_on: db: condition: service_healthy`, meaning Docker will not start the backend until the health check passes.

---

### 3.2 `backend`

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile.dev
  container_name: habits-backend
  restart: unless-stopped
  ports:
    - "${PORT:-3000}:3000"
  env_file:
    - ./backend/.env
  depends_on:
    db:
      condition: service_healthy
  volumes:
    - ./backend:/app
    - backend_node_modules:/app/node_modules
```

| Property | Value | Notes |
|---|---|---|
| **Image** | Built from `backend/Dockerfile.dev` | Dev image with `tsx --watch` |
| **Port** | `${PORT:-3000}:3000` | Defaults to `3000`, overridable via `PORT` in `backend/.env` |
| **Env file** | `./backend/.env` | Contains `DATABASE_URL`, `PORT`, `JWT_SECRET` |
| **Startup** | After `db` is healthy | Guaranteed connection readiness |
| **Hot reload** | `./backend:/app` bind mount | Source changes reflect immediately via `tsx --watch` |
| **Node modules** | Isolated named volume | Prevents host/container conflicts |

#### Startup Sequence (handled by `entrypoint.js`)

1. `npx prisma migrate deploy` — applies pending migrations.
2. `npx prisma db seed` — upserts the 8 default habit categories.
3. `npm run dev` — starts `tsx --watch src/index.ts`.

---

### 3.3 `frontend`

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.dev
  container_name: habits-frontend
  restart: unless-stopped
  ports:
    - "5173:5173"
  env_file:
    - ./frontend/.env
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
```

| Property | Value | Notes |
|---|---|---|
| **Image** | Built from `frontend/Dockerfile.dev` | Runs `vite --host` |
| **Port** | `5173:5173` (fixed) | Standard Vite dev server port |
| **Env file** | `./frontend/.env` | Contains `VITE_API_URL` |
| **Hot reload** | `./frontend:/app` bind mount | Vite HMR works out of the box |
| **Node modules** | Isolated named volume | Prevents host/container conflicts |

---

## 4. Environment Variables

Three `.env` files are required. None of them should be committed to version control.

### Root `.env` (for the `db` service)

Located at: `habits-tracker/.env`

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DB=habits_tracker_db
```

These variables are consumed directly by the official `postgres:17-alpine` image to initialize the database on first run.

---

### `backend/.env` (for the backend service)

Template available at `backend/.env.example`:

```env
DATABASE_URL=postgresql://postgres:admin@db:5432/habits_tracker_db?schema=public
PORT=3000
JWT_SECRET=your_super_secret_key
```

> [!IMPORTANT]
> When running inside Docker, `DATABASE_URL` must use `db` as the hostname (the service name in `docker-compose.yml`), **not** `localhost`. This is a common misconfiguration when switching between local and Docker environments.

---

### `frontend/.env` (for the frontend service)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 5. Dev Entrypoint Script

**File:** `backend/scripts/entrypoint.js`

This Node.js script is the `CMD` for the `Dockerfile.dev` image. It automates the full database bootstrap sequence each time the container starts:

```js
import { execSync } from 'child_process';

console.log('Running migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('Seeding database...');
execSync('npx prisma db seed', { stdio: 'inherit' });

console.log('Starting server...');
execSync('npm run dev', { stdio: 'inherit' });
```

| Step | Command | Purpose |
|---|---|---|
| 1 | `prisma migrate deploy` | Applies all pending SQL migrations to the database |
| 2 | `prisma db seed` | Upserts the 8 core habit categories (idempotent) |
| 3 | `npm run dev` | Starts `tsx --watch src/index.ts` |

> [!NOTE]
> `prisma migrate deploy` (not `migrate dev`) is used here intentionally. `migrate deploy` applies pre-existing migration files without creating new ones, which is the correct command for automated startup scripts and CI.

---

## 6. Production Dockerfile (`backend/Dockerfile`)

Build the backend runtime and release tools from the same revision.

```sh
docker build -f backend/Dockerfile -t habits-api:release backend
docker build -f backend/Dockerfile --target release-tools -t habits-release-tools:release backend
```

Run the release tools image once with the target `DATABASE_URL` supplied through the deployment secret store. Its default command applies migrations. Run `./node_modules/.bin/prisma db seed` in the same image where categories have not been initialized. Start the API only after the release jobs succeed. The runtime uses production dependencies and an unprivileged user. `/api/health` checks HTTP liveness and `/api/ready` checks database connectivity.

> [!NOTE]
> `DATABASE_URL="postgresql://dummy"` is passed during the build stage only to satisfy Prisma's `generate` command, which requires a valid-format URL at build time even though it never actually connects.

---

## 7. Volume Strategy

Three named volumes are declared:

| Volume | Mounted At | Purpose |
|---|---|---|
| `postgres_data` | `/var/lib/postgresql/data` in `db` | Persists the database across container restarts |
| `backend_node_modules` | `/app/node_modules` in `backend` | Shields container's `node_modules` from the host bind mount |
| `frontend_node_modules` | `/app/node_modules` in `frontend` | Shields container's `node_modules` from the host bind mount |

The `node_modules` isolation pattern works because Docker volume mount precedence means the named volume (with the correct Linux binaries) takes priority over the bind-mounted host directory at that specific path.

---

## 8. Changes vs `dev` Branch

This section documents every code change introduced by `feat/dockerize-env` relative to `dev`.

### New Files (all additions)

| File | Description |
|---|---|
| `docker-compose.yml` | Orchestrates `db`, `backend`, `frontend` services |
| `backend/Dockerfile` | Multi-stage production build for the backend |
| `backend/Dockerfile.dev` | Dev image; installs deps, generates Prisma client, runs `entrypoint.js` |
| `backend/.dockerignore` | Excludes `node_modules`, `dist`, `.env`, `*.log` from the Docker build context |
| `backend/scripts/entrypoint.js` | Runs migrate → seed → dev server on container start |
| `frontend/Dockerfile.dev` | Dev image; installs deps, exposes `5173`, runs `vite --host` |
| `frontend/.dockerignore` | Excludes `node_modules`, `dist`, `.env` from the Docker build context |

---

### Modified Files

#### `backend/src/config/db.ts` — Replaced Neon adapter with standard Prisma client

```diff
- import { neonConfig } from '@neondatabase/serverless';
- import { PrismaNeon } from '@prisma/adapter-neon';
- import ws from 'ws';
  import 'dotenv/config';

- // Required for Neon to work in a Node/Express environment
- neonConfig.webSocketConstructor = ws;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in the environment variables");
  }

- const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
- export const prisma = new PrismaClient({ adapter });
+ export const prisma = new PrismaClient();
```

**Why:** The `dev` branch connected to a **Neon serverless** cloud database via WebSocket. This branch switches to a **standard local PostgreSQL container**, so the Neon-specific adapter and `ws` WebSocket polyfill are no longer needed. The standard `PrismaClient()` uses the `DATABASE_URL` from the environment directly.

---

#### `backend/src/index.ts` — Bind to `0.0.0.0` for container networking

```diff
- const PORT = process.env.PORT || 3000;
+ const PORT = Number(process.env.PORT) || 3000;

- app.listen(PORT, () => {
+ app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running url: http://localhost:${PORT}`)
  })
```

**Why:** By default, Express binds to `127.0.0.1` (loopback). Inside a Docker container, this makes the server unreachable from outside the container. Binding to `0.0.0.0` allows Docker's port mapping (`3000:3000`) to forward traffic correctly. `PORT` is also cast to `Number` to satisfy Express's type signature.

---

#### `frontend/package.json` — Add `--host` flag to Vite dev server

```diff
- "dev": "vite",
+ "dev": "vite --host",
```

**Why:** Same reason as the backend — Vite's dev server needs to bind to `0.0.0.0` instead of `localhost` so that the `5173:5173` port mapping works from outside the container.

---

#### `backend/package.json` — Fix production start script extension

```diff
- "start": "node dist/index.ts",
+ "start": "node dist/index.js",
```

**Why:** TypeScript compiles to `.js` files. The previous `start` script pointed to `.ts` which doesn't exist in `dist/`, causing the production `CMD ["node", "dist/index.js"]` to fail.

---

#### `backend/src/controllers/cycleProgress.controller.ts` — Minor cleanup

```diff
- const totalDaysInclude = 31;
  const daysLogged = logs.length;

- const startDate = activeCycle.startDate;
  const today = new Date();
```

**Why:** Two unused variables (`totalDaysInclude`, `startDate`) were removed. Arrow function parameter style was also normalized for consistency.

---

## 9. Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Compose plugin.

### Steps

**1. Copy and configure your environment files:**

```bash
# Root .env (for the db service)
cp .env.example .env  # or create manually — see Section 4

# Backend .env
cp backend/.env.example backend/.env
# Edit backend/.env and set:
#   DATABASE_URL=postgresql://postgres:admin@db:5432/habits_tracker_db?schema=public
#   JWT_SECRET=your_secret_here
#   PORT=3000

# Frontend .env
echo "VITE_API_URL=http://localhost:3000/api" > frontend/.env
```

**2. Build and start all services:**

```bash
docker compose up --build
```

**3. Access the application:**

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health check | http://localhost:3000/api/health |

**4. Useful commands:**

```bash
# Start in detached mode
docker compose up -d

# View live logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (wipes the database)
docker compose down -v

# Rebuild a specific service after Dockerfile changes
docker compose up --build backend
```
