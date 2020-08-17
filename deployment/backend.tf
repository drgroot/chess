terraform {
  required_version = "0.12.25"
  
  backend "s3" {
    force_path_style = true
    bucket = "terraform"
    key    = "chess.state"
    region = "us-east-1"
    skip_credentials_validation = true
    skip_metadata_api_check = true
    skip_region_validation = true
  }
}

provider "kubernetes" {
  version = "~> 1.11"
  load_config_file = "false"

  host = "https://${var.KUBERNETES_HOST}:${var.KUBERNETES_PORT}"
  client_certificate = file("./secrets/kube/user.crt")
  client_key = file("./secrets/kube/user.key")
  cluster_ca_certificate = file("./secrets/kube/ca.crt")
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

provider "docker" {
}

provider "cloudflare" {
  version = "~> 2"
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