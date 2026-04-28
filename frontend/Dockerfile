# ──────────────────────────────────────────────────────────────
# Stage 1 — Build the Vite app
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# In K8s the frontend talks to the backend via Nginx proxy (/api/),
# so the API URL is just a relative path — no hardcoded host needed.
ENV VITE_API_URL=/api

RUN npm run build

# ──────────────────────────────────────────────────────────────
# Stage 2 — Serve with Nginx
# ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
