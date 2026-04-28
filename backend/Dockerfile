# ──────────────────────────────────────────────────────────────
# Stage 1 — Dependencies
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# ──────────────────────────────────────────────────────────────
# Stage 2 — Production image
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

# Copy installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R nodeuser:nodejs uploads

USER nodeuser

ENV NODE_ENV=production
ENV PORT=5002

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5002/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
