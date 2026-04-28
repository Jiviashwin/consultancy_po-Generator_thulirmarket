# ============================================================
# Persistent Volume Claim — uploads storage
# Replaces: k8s/uploads-pvc.yaml
# ============================================================

resource "kubernetes_persistent_volume_claim" "uploads_pvc" {
  metadata {
    name      = "uploads-pvc"
    namespace = kubernetes_namespace.po_generator.metadata[0].name

    labels = {
      "app.kubernetes.io/name"       = "po-generator"
      "app.kubernetes.io/component"  = "backend"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = "2Gi"
      }
    }

    # Minikube uses the "standard" storage class by default.
    # Leave empty to use the cluster default.
    # storage_class_name = "standard"
  }
}
