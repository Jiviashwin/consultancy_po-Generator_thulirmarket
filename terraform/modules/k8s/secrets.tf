# ============================================================
# Secrets — sensitive application credentials
# Replaces: k8s/secrets.yaml
# ============================================================
# Terraform accepts plain-text values and encodes them
# automatically (no manual base64 needed unlike raw YAML).
# Values are passed from terraform.tfvars (gitignored).
# ============================================================

resource "kubernetes_secret" "po_generator_secrets" {
  metadata {
    name      = "po-generator-secrets"
    namespace = kubernetes_namespace.po_generator.metadata[0].name

    labels = {
      "app.kubernetes.io/name"       = "po-generator"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  type = "Opaque"

  # Terraform handles base64-encoding automatically.
  # Pass real plain-text values in terraform.tfvars.
  data = {
    MONGODB_URI    = var.mongodb_uri
    JWT_SECRET     = var.jwt_secret
    SESSION_SECRET = var.session_secret
    SMTP_USER      = var.smtp_user
    SMTP_PASS      = var.smtp_pass
  }
}
