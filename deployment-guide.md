# DigiHR+ — Deployment & Setup Guide

This guide covers the complete local setup, database seeding, and production deployment process for the DigiHR+ application.

---

## 🚀 One-Liner Setup

For a quick start, providing you have a PostgreSQL database running and a `.env` file configured, you can use the automated setup script.

First, ensure your `.env` file is ready:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
SESSION_SECRET="your-super-secret-jwt-key"
```

Next, make the setup script executable and run it:
```bash
chmod +x setup.sh
./setup.sh
```

**What the one-liner script does:**
1. Installs Node.js dependencies (`npm install`).
2. Generates the Prisma client and applies migrations (`npx prisma generate` && `npx prisma migrate dev`).
3. Runs the comprehensive database seed (`npx prisma db seed`), which includes all base configs and sample data.
4. Builds the Next.js application for production (`npm run build`).

---

## 🗄️ Database Seeding (Detailed)

Our database seeding is fully automated and consists of several stages that run sequentially when you execute `npx prisma db seed`.

The seed configuration is defined in `prisma.config.ts` and runs the following scripts in order:

1. **`prisma/seed.ts`**: The foundational setup. Creates base departments, grades, positions, the admin user (`andiko@company.co.id`), leave types, salary components, and calculates the necessary BPJS and PPh 21 (TER) config.
2. **`prisma/seed-performance.ts`**: Seeds the Performance Management module. Creates a performance cycle (e.g., Mid-Year Review), employee appraisals, and sample KPIs/goals.
3. **`prisma/seed-recruitment.ts`**: Seeds the ATS (Recruitment) module. Generates job requisitions, several dummy candidates, and sample applications spanning different review stages.
4. **`prisma/seed-sample-data.ts`**: A comprehensive HR module seed. Generates 15+ employees across different departments, their family members, shifts, ~300 attendance records, overtime requests, leave balances, and sample payroll runs for January and February.

**Manually running the seed:**
If you ever need to reset your database and run the complete seed manually, run:
```bash
npx prisma migrate reset --force
npx prisma db seed
```

---

## 🐳 Production Deployment (Docker Compose)

The easiest way to deploy DigiHR+ to production is using Docker. The repository includes a `Dockerfile` utilizing a multi-stage approach optimized for Next.js, and a `docker-compose.yml` to spin up both the application and the PostgreSQL database.

### Prerequisites
- Docker Engine
- Docker Compose

### 1. Build and Run

The application uses a `DB_MODE` environment variable to control database behaviour on each container startup. Set this in `docker-compose.yml` **before** running the build.

| `DB_MODE` | What it does |
|-----------|-------------|
| `migrate` | **(default)** Apply pending migrations + run idempotent seed scripts. Safe for normal code updates. |
| `reset` | ⚠️ **Destructive.** Wipes ALL data, re-runs migrations from scratch, and seeds a clean database. |
| `skip` | Skip all database operations. Fastest restart when only app code has changed and the DB is healthy. |

**Option A — Edit `docker-compose.yml` (permanent)**

Open `docker-compose.yml` and change the `DB_MODE` line under the `app` service's `environment` block before running:

```yaml
- DB_MODE=migrate   # safe default — apply migrations + idempotent seed
# - DB_MODE=reset   # wipe & full reseed (clean slate)
# - DB_MODE=skip    # code-only update, skip all DB operations
```

Then start/rebuild:

```bash
docker compose up -d --build
```

**Option B — Override at the command line (one-off, no file edit)**

```bash
# Normal code update (default behaviour)
docker compose up -d --build

# Full database wipe + reseed
DB_MODE=reset docker compose up -d --build

# Code-only hotfix — fastest, skips all DB operations
DB_MODE=skip docker compose up -d --build
```

> ⚠️ **`DB_MODE=reset` is destructive.** All existing data will be permanently deleted. Only use this when you intentionally want a clean slate (e.g., broken migration state, schema overhaul, or staging environment reset).

### 3. Application Access
By default, the application runs on port `3000`.
You can access it at: `http://localhost:3000`

### 4. Viewing Logs
To check the logs for debugging:
```bash
docker-compose logs -f app
```

### 5. Shutting Down
To gracefully stop the application and database:
```bash
npm run docker:down
# Or: docker-compose down
```

---

## 🔒 Security Best Practices for Production

- **Credentials:** Always change the default admin password (`Password123!`) immediately upon your first production login.
- **Environment Variables:** Never commit your `.env` file to version control. The `SESSION_SECRET` must be a strong, randomly generated string.
- **HTTPS:** Ensure the application is placed behind a reverse proxy (like Nginx, Traefik, or Cloudflare) configured with SSL/TLS.
