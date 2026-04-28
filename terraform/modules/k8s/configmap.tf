# ============================================================
# ConfigMap — non-sensitive application configuration
# Replaces: k8s/configmap.yaml
# ============================================================

resource "kubernetes_config_map" "po_generator_config" {
  metadata {
    name      = "po-generator-config"
    namespace = kubernetes_namespace.po_generator.metadata[0].name

    labels = {
      "app.kubernetes.io/name"       = "po-generator"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  data = {
    NODE_ENV     = "production"
    PORT         = "5002"
    FRONTEND_URL = "http://${var.ingress_host}"

    # SMTP (non-sensitive)
    SMTP_HOST   = "smtp.gmail.com"
    SMTP_PORT   = "587"
    SMTP_SECURE = "false"

    # Store information
    STORE_NAME    = var.store_name
    STORE_ADDRESS = var.store_address
    STORE_EMAIL   = var.store_email
    STORE_PHONE   = var.store_phone
  }
}
