#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting DigiHR+ Setup..."

if [ ! -f .env ]; then
  echo "⚠️  No .env file found! Please create a .env file with DATABASE_URL before running setup."
  exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🛠️ Generating Prisma Client and applying database migrations..."
npx prisma generate
npx prisma migrate dev --name init

echo "🌱 Seeding the database with base configuration and all sample data..."
# The main seed command (npx prisma db seed) is configured in package.json and prisma.config.ts
# It will run all the seed files sequentially:
# 1. seed.ts (Base departments, grades, users, tax & BPJS config)
# 2. seed-performance.ts (Performance data)
# 3. seed-recruitment.ts (Recruitment ATS data)
# 4. seed-sample-data.ts (Comprehensive employee & HR dummy data)
npx prisma db seed

echo "🔒 Updating admin user password to default..."
npx tsx prisma/update-password.ts

echo "🏗️ Building the Next.js application..."
npm run build

echo "✅ Setup successful! 🎉"
echo "👉 You can now start the application by running: npm run start"
echo "👉 Default login: andiko@company.co.id / Password123!"
