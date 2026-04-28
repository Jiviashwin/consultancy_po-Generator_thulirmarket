# ============================================================
# Module Variables — k8s
# ============================================================

variable "namespace" {
  type    = string
  default = "po-generator"
}

variable "github_username" {
  type = string
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "backend_replicas" {
  type    = number
  default = 2
}

variable "frontend_replicas" {
  type    = number
  default = 2
}

variable "ingress_host" {
  type    = string
  default = "po-generator.local"
}

variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "session_secret" {
  type      = string
  sensitive = true
}

variable "smtp_user" {
  type      = string
  sensitive = true
}

variable "smtp_pass" {
  type      = string
  sensitive = true
}

variable "store_name" {
  type    = string
  default = "SuperMart Retail Store"
}

variable "store_address" {
  type    = string
  default = "123 Main Street, City, State, ZIP"
}

variable "store_email" {
  type    = string
  default = "admin@supermart.com"
}

variable "store_phone" {
  type    = string
  default = "+1-234-567-8900"
}
