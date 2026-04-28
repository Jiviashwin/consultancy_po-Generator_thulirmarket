# ============================================================
# Root Main — PO Generator Terraform
# ============================================================
# Calls the k8s module which manages all Kubernetes resources.
# Run order:
#   terraform init
#   terraform plan  -var="image_tag=<tag>"
#   terraform apply -auto-approve -var="image_tag=<tag>"
# ============================================================

module "k8s" {
  source = "./modules/k8s"

  # Cluster
  namespace = var.namespace

  # Images
  github_username = var.github_username
  image_tag       = var.image_tag

  # Scale
  backend_replicas  = var.backend_replicas
  frontend_replicas = var.frontend_replicas

  # Ingress
  ingress_host = var.ingress_host

  # Secrets
  mongodb_uri    = var.mongodb_uri
  jwt_secret     = var.jwt_secret
  session_secret = var.session_secret
  smtp_user      = var.smtp_user
  smtp_pass      = var.smtp_pass

  # Non-sensitive config
  store_name    = var.store_name
  store_address = var.store_address
  store_email   = var.store_email
  store_phone   = var.store_phone
}
