# ============================================================
# Root Variables — PO Generator Terraform
# ============================================================

# ── Cluster / kubeconfig ────────────────────────────────────
variable "kubeconfig_path" {
  description = "Path to the kubeconfig file. Defaults to ~/.kube/config (Minikube)."
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "kubectl context to use. 'minikube' for local cluster."
  type        = string
  default     = "minikube"
}

# ── Application ─────────────────────────────────────────────
variable "namespace" {
  description = "Kubernetes namespace for the PO Generator app."
  type        = string
  default     = "po-generator"
}

variable "github_username" {
  description = "Your GitHub username — used to build GHCR image paths."
  type        = string
  default     = "jiviashwin"
}

variable "image_tag" {
  description = "Docker image tag to deploy (e.g. 'latest' or a git SHA)."
  type        = string
  default     = "latest"
}

variable "backend_replicas" {
  description = "Number of backend pod replicas."
  type        = number
  default     = 2
}

variable "frontend_replicas" {
  description = "Number of frontend pod replicas."
  type        = number
  default     = 2
}

variable "ingress_host" {
  description = "Hostname for the Nginx Ingress rule (add to /etc/hosts)."
  type        = string
  default     = "po-generator.local"
}

# ── Secrets (passed via tfvars — NEVER commit real values) ──
variable "mongodb_uri" {
  description = "MongoDB Atlas connection URI."
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (at least 32 characters)."
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Express session secret (at least 32 characters)."
  type        = string
  sensitive   = true
}

variable "smtp_user" {
  description = "SMTP username (Gmail address)."
  type        = string
  sensitive   = true
}

variable "smtp_pass" {
  description = "SMTP password (Gmail App Password)."
  type        = string
  sensitive   = true
}

# ── Non-sensitive config ─────────────────────────────────────
variable "store_name" {
  description = "Store display name."
  type        = string
  default     = "SuperMart Retail Store"
}

variable "store_address" {
  description = "Store address."
  type        = string
  default     = "123 Main Street, City, State, ZIP"
}

variable "store_email" {
  description = "Store contact email."
  type        = string
  default     = "admin@supermart.com"
}

variable "store_phone" {
  description = "Store contact phone."
  type        = string
  default     = "+1-234-567-8900"
}
