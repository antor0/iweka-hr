# ==========================================
# 1. Dependencies Stage
# ==========================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN node -v
RUN npm ci

# Generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# ==========================================
# 2. Build Stage
# ==========================================
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client again just in case (sometimes needed for build)
RUN npx prisma generate

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# ==========================================
# 3. Production Runner Stage
# ==========================================
FROM node:22-alpine AS runner
WORKdir /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built artifacts from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Prisma migrations before starting the app (optional, usually done separately)
# We will just start the Next.js server.
CMD ["node", "server.js"]
