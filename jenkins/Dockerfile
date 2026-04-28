# ============================================================
# Custom Jenkins Image
# Base  : jenkins/jenkins:lts-jdk21
# Extras: Node.js 20, Docker CLI, kubectl
# ============================================================

FROM jenkins/jenkins:lts-jdk21

USER root

# ── System dependencies ───────────────────────────────────
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# ── Node.js 20 (LTS) ─────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    node --version && npm --version

# ── Docker CLI ───────────────────────────────────────────
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
      -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
      https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    docker --version

# ── kubectl (latest stable) ──────────────────────────────
RUN KUBECTL_VERSION=$(curl -fsSL https://dl.k8s.io/release/stable.txt) && \
    curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" \
      -o /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    kubectl version --client

# ── Switch back to jenkins user ───────────────────────────
USER jenkins
