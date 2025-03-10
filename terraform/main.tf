terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Default region for resources"
  type        = string 
  default     = "us-central1"
}

variable "domain_name" {
  description = "Your domain name"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for the application"
  type        = string
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Create GCS bucket for static website hosting
resource "google_storage_bucket" "website" {
  name          = "${var.fqdn}.${var.domain_name}"
  location      = "US"
  force_destroy = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  uniform_bucket_level_access = true
}

# Make bucket public
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.website.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Create Cloud CDN backend bucket
resource "google_compute_backend_bucket" "website" {
  name        = "${var.subdomain}-backend"
  bucket_name = google_storage_bucket.website.name
  enable_cdn  = true
}

# Reserve global IP address
resource "google_compute_global_address" "website" {
  name = "${var.subdomain}-ip"
}

# Create HTTPS certificate
resource "google_compute_managed_ssl_certificate" "website" {
  name = "${var.subdomain}-cert"
  managed {
    domains = ["${var.subdomain}.${var.domain_name}"]
  }
}

# Create URL map
resource "google_compute_url_map" "website" {
  name            = "${var.subdomain}-url-map"
  default_service = google_compute_backend_bucket.website.self_link
}

# Create HTTPS proxy
resource "google_compute_target_https_proxy" "website" {
  name             = "${var.subdomain}-https-proxy"
  url_map          = google_compute_url_map.website.self_link
  ssl_certificates = [google_compute_managed_ssl_certificate.website.self_link]
}

# Create forwarding rule
resource "google_compute_global_forwarding_rule" "website" {
  name       = "${var.subdomain}-forwarding-rule"
  target     = google_compute_target_https_proxy.website.self_link
  port_range = "443"
  ip_address = google_compute_global_address.website.address
}

# Create DNS record
resource "google_dns_record_set" "website" {
  name         = "${var.subdomain}.${var.domain_name}."
  type         = "A"
  ttl          = 300
  managed_zone = replace(var.domain_name, ".", "-")
  rrdatas      = [google_compute_global_address.website.address]
}
