terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }

  backend "gcs" {
    prefix = "terraform/state"
  }
}

variable "domain_name" {
  description = "Your domain name"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for the application"
  type        = string
}

variable "bucket_name" {
  type        = string
}

variable "hosted_zone" {
  type        = string
}

variable "global_address" {
  type        = string
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

provider "google" {
  project = var.project_id
  region  = var.region
}

# Create GCS bucket for static website hosting
resource "google_storage_bucket" "static-public-bucket" {
  name          = "${var.bucket_name}"
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
resource "google_storage_bucket_iam_member" "static-public-bucket-public-read" {
  bucket = google_storage_bucket.static-public-bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Create Cloud CDN backend bucket
resource "google_compute_backend_bucket" "static-public-bucket-backend" {
  name        = replace("${var.bucket_name}-backend", "_", "-")
  bucket_name = google_storage_bucket.static-public-bucket.name
  enable_cdn  = true
}

# Create DNS record
resource "google_dns_record_set" "static-public-bucket-dns-record" {
  name         = "${var.subdomain}.${var.domain_name}."
  type         = "A"
  ttl          = 300
  managed_zone = var.hosted_zone
  rrdatas      = [var.global_address]
}

output "backend-link" {
  value = google_compute_backend_bucket.static-public-bucket-backend.self_link
}
