# ──────────────────────────────────────────────────────────────
# Stage 1 — Build the Vite app
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# In K8s/Docker the frontend talks to the backend via Nginx proxy (/api/),
# so the API URL is just a relative path — no hardcoded host needed.
ENV VITE_API_URL=/api

RUN npm run build

# ──────────────────────────────────────────────────────────────
# Stage 2 — Serve with Nginx
# ──────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# Install gettext for envsubst (substitutes ${BACKEND_HOST} in nginx.conf)
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our config template (uses ${BACKEND_HOST} placeholder)
COPY nginx.conf /etc/nginx/templates/app.conf.template

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

# Nginx official image auto-runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/ — BACKEND_HOST is injected here
CMD ["nginx", "-g", "daemon off;"]
