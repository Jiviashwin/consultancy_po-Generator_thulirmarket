# ============================================================
# Namespace — po-generator
# ============================================================

resource "kubernetes_namespace" "po_generator" {
  metadata {
    name = var.namespace

    labels = {
      "app.kubernetes.io/name"       = "po-generator"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}
