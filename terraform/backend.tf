terraform {
  backend "gcs" {
    bucket = "tf-state-pdf-extractor"
    prefix = "terraform/state"
  }
}
