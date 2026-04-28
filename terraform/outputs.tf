# ============================================================
# Root Outputs — PO Generator Terraform
# ============================================================

output "namespace" {
  description = "Kubernetes namespace where the app is deployed."
  value       = module.k8s.namespace
}

output "backend_service_name" {
  description = "Name of the backend Kubernetes Service."
  value       = module.k8s.backend_service_name
}

output "frontend_service_name" {
  description = "Name of the frontend Kubernetes Service."
  value       = module.k8s.frontend_service_name
}

output "ingress_host" {
  description = "Hostname to add to /etc/hosts (using minikube ip)."
  value       = module.k8s.ingress_host
}

output "app_url" {
  description = "Local URL to access the application."
  value       = "http://${module.k8s.ingress_host}"
}

output "nodeport_url" {
  description = "Access via Minikube NodePort (run: minikube ip)."
  value       = "http://<minikube-ip>:30080"
}

output "kubectl_check_pods" {
  description = "Command to check pod status."
  value       = "kubectl get pods -n ${module.k8s.namespace}"
}
