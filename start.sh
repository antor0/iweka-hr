#!/bin/sh
set -e

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Running database seeds..."
npx tsx prisma/seed.ts
npx tsx prisma/seed-performance.ts
npx tsx prisma/seed-recruitment.ts
npx tsx prisma/seed-sample-data.ts

echo "🔒 Updating admin user password..."
npx tsx prisma/update-password.ts

echo "🚀 Starting Next.js application..."
exec node server.js
