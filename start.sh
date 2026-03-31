#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────────
# DB_MODE controls database behaviour on container startup:
#
#   reset   → Drop ALL tables and re-run migrations + full seed
#             (destructive! use for a clean slate)
#   migrate → (default) Apply pending migrations + run idempotent
#             seed scripts (safe for code-only updates)
#   skip    → Skip all database operations entirely
#             (fastest restart when only app code changed)
# ──────────────────────────────────────────────────────────────────
DB_MODE="${DB_MODE:-migrate}"

echo "🛠️  DB_MODE = $DB_MODE"

if [ "$DB_MODE" = "reset" ]; then
    echo "⚠️  Resetting database (dropping all data)..."
    npx prisma migrate reset --force --skip-seed
    echo "📦 Running fresh migrations..."
    npx prisma migrate deploy
    echo "🌱 Running full seed..."
    npx tsx prisma/seed.ts
    npx tsx prisma/seed-performance.ts
    npx tsx prisma/seed-recruitment.ts
    npx tsx prisma/seed-sample-data.ts
    echo "🔒 Updating admin user password..."
    npx tsx prisma/update-password.ts

elif [ "$DB_MODE" = "migrate" ]; then
    echo "📦 Applying pending migrations..."
    npx prisma migrate deploy
    echo "🌱 Running idempotent seed scripts..."
    npx tsx prisma/seed.ts
    npx tsx prisma/seed-performance.ts
    npx tsx prisma/seed-recruitment.ts
    npx tsx prisma/seed-sample-data.ts
    echo "🔒 Updating admin user password..."
    npx tsx prisma/update-password.ts

elif [ "$DB_MODE" = "skip" ]; then
    echo "⏩ Skipping all database operations (code-only update)."

else
    echo "❌ Unknown DB_MODE '$DB_MODE'. Valid values: reset | migrate | skip"
    exit 1
fi

echo "🚀 Starting Next.js application..."
exec node server.js
