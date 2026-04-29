# ──────────────────────────────────────────────────────────────
# Stage 1 — Dependencies  (isolated, cache-friendly)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install ONLY production deps + clean npm cache in same layer
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force \
    && find /app/node_modules -name "*.md" -delete \
    && find /app/node_modules -name "*.ts" ! -name "*.d.ts" -delete \
    && find /app/node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true \
    && find /app/node_modules -name "*.map" -delete 2>/dev/null || true

# ──────────────────────────────────────────────────────────────
# Stage 2 — Lean production image  (~130 MB vs ~200 MB before)
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# dumb-init + wget for healthcheck — clean apk cache in ONE layer
RUN apk add --no-cache dumb-init wget \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Non-root user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

# Copy stripped node_modules from deps stage (not full image!)
COPY --from=deps /app/node_modules ./node_modules

# Copy only necessary source files (NOT tests, docs, etc.)
COPY server.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY models/ ./models/
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY utils/ ./utils/
COPY package.json ./

# Uploads dir + permissions in one layer
RUN mkdir -p uploads && chown -R nodeuser:nodejs /app

USER nodeuser

ENV NODE_ENV=production
ENV PORT=5002

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5002/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
