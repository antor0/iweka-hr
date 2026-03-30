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
WORKDIR /app

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
# Create uploads directory and set permissions for dynamic image storage
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Install tsx globally and copy start script
RUN npm install -g tsx prisma
RUN npm install dotenv
COPY --from=builder --chown=nextjs:nodejs /app/start.sh ./
RUN chmod +x start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations, seed, and start the app
CMD ["./start.sh"]
