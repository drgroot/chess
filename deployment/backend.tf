terraform {
  
  required_providers {
    
    cloudflare = {
      source = "cloudflare/cloudflare"
      version = "2.11.0"
    }
    
    docker = {
      source = "terraform-providers/docker"
    }
    
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "1.12.0"
    }

    tls = {
      source = "hashicorp/tls"
    }
  }

  backend "s3" {
    force_path_style = true
    bucket = "terraform"
    key    = "chess.state"
    region = "us-east-1"
    skip_credentials_validation = true
    skip_metadata_api_check = true
    skip_region_validation = true
  }

  required_version = ">= 0.13"
}

provider "kubernetes" {
  load_config_file = "false"

  host = "https://${var.KUBERNETES_HOST}:${var.KUBERNETES_PORT}"
  client_certificate = file("./secrets/user.crt")
  client_key = file("./secrets/user.key")
  cluster_ca_certificate = file("./secrets/ca.crt")
}

resource "kubernetes_secret" "slack_url" {
  metadata {
    name   = "slack-url"
    namespace = "chess"
  }

  data = {
    SLACK_URL = var.slack_url
  }
}

# dns stuff
data "cloudflare_zones" "domain" {
  filter {
    name = "yusufali.ca"
  }
}

resource "cloudflare_record" "root" {
  zone_id = data.cloudflare_zones.domain.zones[0].id
  name    = "chess"
  value   = var.KUBERNETES_HOST
  type    = "CNAME"
  proxied = true
  ttl     = 1
}