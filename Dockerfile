# =============================================================================
# Groway Merchant OS — Production Dockerfile
# Multi-stage build for a minimal, secure production image.
# Optimized for Oracle Cloud ARM (Ampere A1) instances.
# Designed and Built by Motheto Selepe.
# =============================================================================

# ---------- Stage 1: Dependencies ----------
FROM oven/bun:1.3 AS deps
WORKDIR /app

# Copy lockfile + package.json for cacheable install
COPY package.json bun.lockb* yarn.lock* package-lock.json* ./
COPY prisma ./prisma

# Install dependencies (including devDeps for build step)
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Generate Prisma Client
RUN bunx prisma generate

# ---------- Stage 2: Build ----------
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js app (standalone output for minimal image)
# We override the next.config to enable standalone output during build
RUN bun run build

# ---------- Stage 3: Runner (minimal production image) ----------
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy standalone build + static assets + public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files for database operations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy seed scripts + scripts dir
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed-demo.ts ./prisma/seed-demo.ts

# Create data directory for SQLite (persistent volume mount point)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Copy the entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/platform/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "server.js"]
