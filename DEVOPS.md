# PO Generator — DevOps Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│  (push to main) → triggers Jenkins Pipeline             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Jenkins (local Docker)                 │
│  1. Checkout → 2. Install → 3. Test → 4. Docker Build   │
│  5. Push to GHCR → 6. kubectl apply → K8s Deploy        │
└────────────────────────┬────────────────────────────────┘
                         │ push images
                         ▼
┌─────────────────────────────────────────────────────────┐
│          GitHub Container Registry (GHCR)               │
│  ghcr.io/<user>/po-generator-backend:<tag>              │
│  ghcr.io/<user>/po-generator-frontend:<tag>             │
└────────────────────────┬────────────────────────────────┘
                         │ pull images
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Minikube (Kubernetes Cluster)               │
│  Namespace: po-generator                                 │
│  ┌───────────────┐    ┌───────────────┐                 │
│  │  frontend x2  │    │  backend x2   │                 │
│  │  (nginx:80)   │───▶│  (node:5002)  │────▶ MongoDB   │
│  └───────────────┘    └───────────────┘       Atlas     │
│         ▲                    ▲                           │
│         └──── Ingress ───────┘                          │
│         po-generator.local                               │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Install these tools on your Mac:

```bash
# Docker Desktop
brew install --cask docker

# Minikube
brew install minikube

# kubectl
brew install kubectl

# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Enable Ingress addon
minikube addons enable ingress
```

---

## Step 1 — Replace Placeholders

### 1a. In Kubernetes manifests — replace your GitHub username

In **`k8s/backend-deployment.yaml`** and **`k8s/frontend-deployment.yaml`**, replace:
```
GITHUB_USERNAME  →  your actual GitHub username
```

### 1b. In Jenkinsfile — replace your GitHub username

```groovy
GITHUB_USERNAME = "REPLACE_WITH_YOUR_GITHUB_USERNAME"
```

---

## Step 2 — Encode Your Secrets

Run the following commands to base64-encode your secret values:

```bash
# MongoDB Atlas URI
echo -n "mongodb+srv://user:pass@cluster.mongodb.net/po-generator" | base64

# JWT Secret (use a long random string)
echo -n "your-jwt-secret-at-least-32-chars" | base64

# Session Secret
echo -n "your-session-secret-at-least-32-chars" | base64

# SMTP credentials
echo -n "your-email@gmail.com" | base64
echo -n "your-app-specific-password" | base64

# Razorpay (if used)
echo -n "rzp_live_xxxxx" | base64
echo -n "your-razorpay-secret" | base64
```

Paste these values into `k8s/secrets.yaml` in the `data:` section.

> ⚠️ **NEVER commit `k8s/secrets.yaml` with real values to Git!**
> Add it to `.gitignore` or use a secrets manager.

---

## Step 3 — Docker Compose (Local Test)

Test both containers are working before touching Kubernetes:

```bash
# From the po-generator/ root directory
docker-compose up --build

# App is now at http://localhost (frontend → nginx → backend)
# API health check:
curl http://localhost/api/health

# Stop everything
docker-compose down
```

---

## Step 4 — Deploy to Kubernetes (Minikube)

```bash
# 1. Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/uploads-pvc.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 2. Check pods are Running
kubectl get pods -n po-generator

# 3. Add Minikube IP to /etc/hosts
echo "$(minikube ip) po-generator.local" | sudo tee -a /etc/hosts

# 4. Open the app
open http://po-generator.local

# 5. Or use NodePort directly
open http://$(minikube ip):30080
```

### Useful kubectl commands

```bash
# Watch pods
kubectl get pods -n po-generator -w

# View logs
kubectl logs -f deployment/backend  -n po-generator
kubectl logs -f deployment/frontend -n po-generator

# Describe a pod (for debugging)
kubectl describe pod <pod-name> -n po-generator

# Scale manually
kubectl scale deployment backend --replicas=3 -n po-generator

# Delete everything (clean slate)
kubectl delete namespace po-generator
```

---

## Step 5 — Start Jenkins Locally

```bash
# From the po-generator/ directory
cd jenkins
docker-compose up -d

# Get admin password
docker exec jenkins-server cat /var/jenkins_home/secrets/initialAdminPassword

# Open Jenkins
open http://localhost:8080
```

### Configure Jenkins (one-time setup)

1. **Install Plugins**: Install suggested plugins + "Pipeline", "Git", "Docker Pipeline"
2. **Add GHCR Credentials**:
   - Go to: **Manage Jenkins → Credentials → Global → Add Credentials**
   - Kind: **Username with password**
   - ID: `ghcr-credentials`
   - Username: your GitHub username
   - Password: GitHub Personal Access Token (scopes: `read:packages`, `write:packages`, `delete:packages`)

3. **Add Kubeconfig Credential**:
   - Kind: **Secret file**
   - ID: `kubeconfig`
   - File: upload your `~/.kube/config`

4. **Create Pipeline Job**:
   - New Item → Pipeline
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**, enter your repo URL
   - Script Path: `Jenkinsfile`
   - Branch: `*/main`

5. **Run the pipeline** — click **"Build Now"**

---

## Step 6 — GitHub Personal Access Token (for GHCR)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Scopes: ✅ `write:packages`, ✅ `read:packages`, ✅ `delete:packages`
4. Copy the token → paste as Jenkins credential password

---

## File Structure Reference

```
po-generator/
├── Jenkinsfile                    ← CI/CD pipeline definition
├── docker-compose.yml             ← Local multi-service dev
├── DEVOPS.md                      ← This file
├── backend/
│   ├── Dockerfile                 ← Node.js production image
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile                 ← Vite build + Nginx image
│   ├── nginx.conf                 ← Nginx config with /api proxy
│   └── .dockerignore
├── k8s/
│   ├── namespace.yaml             ← po-generator namespace
│   ├── secrets.yaml               ← Sensitive env vars (base64)
│   ├── configmap.yaml             ← Non-sensitive config
│   ├── uploads-pvc.yaml           ← Persistent storage for uploads
│   ├── backend-deployment.yaml    ← Backend pods (2 replicas)
│   ├── backend-service.yaml       ← ClusterIP for backend
│   ├── frontend-deployment.yaml   ← Frontend pods (2 replicas)
│   ├── frontend-service.yaml      ← NodePort for frontend
│   └── ingress.yaml               ← Nginx Ingress routing
└── jenkins/
    └── jenkins-docker-compose.yml ← Run Jenkins in Docker
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `minikube start` fails | Run `minikube delete` then retry with `--driver=docker` |
| Pods stuck in `ImagePullBackOff` | Check GHCR image name/tag and credentials |
| Backend pod `CrashLoopBackOff` | Run `kubectl logs <pod> -n po-generator` — usually a missing env var |
| Ingress not routing | Check `minikube addons enable ingress` and `/etc/hosts` entry |
| Jenkins can't build Docker | Ensure `/var/run/docker.sock` is mounted in Jenkins compose |
| `VITE_API_URL` not working | In Docker/K8s, it should be `/api` (relative) — nginx handles the proxy |
