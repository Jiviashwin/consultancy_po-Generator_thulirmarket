# ============================================================
# Terraform Providers — PO Generator
# ============================================================
# Required providers:
#   - hashicorp/kubernetes : manages K8s resources on Minikube
#   - hashicorp/helm       : (optional) for future Helm chart use
# ============================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
  }
}

# ── Kubernetes Provider ─────────────────────────────────────
# Reads your local kubeconfig (~/.kube/config).
# In Jenkins the KUBECONFIG env var points to the secret file.
provider "kubernetes" {
  config_path    = var.kubeconfig_path
  config_context = var.kube_context
}

# ── Helm Provider ───────────────────────────────────────────
provider "helm" {
  kubernetes {
    config_path    = var.kubeconfig_path
    config_context = var.kube_context
  }
}
