# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy Prisma schema so `prisma generate` can run
COPY prisma ./prisma
RUN npx prisma generate

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy installed deps and generated Prisma client from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application source
COPY src ./src

# Run migrations then start server
# (In production, run migrations in a separate init container or CI step)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]

EXPOSE 5000