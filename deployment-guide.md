# HRIS Pro — Deployment & Setup Guide

This guide covers the complete local setup, database seeding, and production deployment process for the HRIS Pro application.

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

1. **`prisma/seed.ts`**: The foundational setup. Creates base departments, grades, positions, the admin user (`wisesa@company.co.id`), leave types, salary components, and calculates the necessary BPJS and PPh 21 (TER) config.
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

The easiest way to deploy HRIS Pro to production is using Docker. The repository includes a `Dockerfile` utilizing a multi-stage approach optimized for Next.js, and a `docker-compose.yml` to spin up both the application and the PostgreSQL database.

### Prerequisites
- Docker Engine
- Docker Compose

### 1. Build and Run
Starting the full stack is easy:

```bash
# This starts both the 'app' container and 'db' container in the background
npm run docker:up
# Or alternatively: docker-compose up -d --build
```

### 2. Seed the Production Database
Once the containers are up and running, you need to apply migrations and seed the database inside the application container:

```bash
# Run migrations and seed inside the running container
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```
*(Remember: Only run the full sample data seed if you want dummy data in your production/staging environment. Otherwise, consider running a stripped-down script that only runs `prisma/seed.ts`.)*

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
