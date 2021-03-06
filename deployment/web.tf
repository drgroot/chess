data "kubernetes_service" "web" {
  metadata {
    name = "chess-web"
    namespace = "chess"
  }
}

variable "WEB_HASH" {
  type    = string
}

resource "tls_private_key" "tls_private" {
  algorithm = "RSA"
}

resource "tls_cert_request" "tls_crt" {
  key_algorithm = tls_private_key.tls_private.algorithm
  private_key_pem = tls_private_key.tls_private.private_key_pem

  subject {
    common_name = "YusufAli"
    organization = "YusufAliChess"
    country = "CA"
    province = "Ontario" 
  }
}

resource "cloudflare_origin_ca_certificate" "tls_cert" {
  csr = tls_cert_request.tls_crt.cert_request_pem
  hostnames = ["chess.yusufali.ca"]
  request_type = "origin-rsa"
  requested_validity = 5475
}

resource "kubernetes_config_map" "sidecarscript" {
  metadata {
    name = "chess-sidecarscript"
    namespace = "chess"
  }

  data = {
    "start.sh" = "rm -rf /git/html && git clone --single-branch --depth 1 -b $GIT_BRANCH $GIT_REPO $GIT_DESTINATION && tail -f /dev/null"
  }
}

resource "kubernetes_config_map" "nginx_config" {
  metadata {
    name = "nginx-conf"
    namespace = "chess"
  }

  data = {
    "default.conf" = <<EOF
    server {
      listen 80 default_server;
      server_name _;
      return 301 https://$host$request_uri;
    }

    server {
      listen 443 ssl;
      server_name ${cloudflare_record.root.hostname};
      ssl_certificate /ssl/tls.crt;
      ssl_certificate_key /ssl/tls.key;

      # gzip all requests
      gzip on;
      gzip_min_length 1024;
      gzip_vary on;
      gzip_proxied expired no-cache no-store private auth;
      gzip_types text/plain text/css text/javascript image/png image/jpeg application/x-javascript;
      gzip_disable "MSIE [1-6]\.";

      ignore_invalid_headers off;
      client_max_body_size 0;
      proxy_buffering off;

      root  /repo/html;
      index index.html index.html;

      location /api/ {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        proxy_pass http://${data.kubernetes_service.webapi.metadata[0].name}.chess.svc.cluster.local:${data.kubernetes_service.webapi.spec[0].port[0].port}/api/;
      }

      location ~* \.(?:ico|jpe?g|png)$ {
        expires 300d;
        add_header Pragma public;
        add_header Cache-Control "public";
      }

      location ~* \.(?:css|js)$ {
        expires 300d;
        add_header Pragma public;
        add_header Cache-Control "public";
      }
    }
  EOF
  }
}

resource "kubernetes_secret" "ssl" {
  metadata {
    name      = "ssl"
    namespace = "chess"
  }

  type = "tls"

  data = {
    "tls.crt" = cloudflare_origin_ca_certificate.tls_cert.certificate
    "tls.key" = tls_private_key.tls_private.private_key_pem
  }
}

resource "kubernetes_horizontal_pod_autoscaler" "nginx" {
  metadata {
    name = kubernetes_deployment.nginx.metadata[0].name
    namespace = "chess"
  }

  spec {
    min_replicas = 1
    max_replicas = 10
  
    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = kubernetes_deployment.nginx.metadata[0].name
    }

    metric {
      type = "Resource"
      
      resource {
        name = "cpu"
        target {
          type = "Utilization"
          average_utilization = 50
        }
      }
    }
  }
}

resource "kubernetes_deployment" "nginx" {
  metadata {
    name = "nginx"
    namespace = "chess"
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = data.kubernetes_service.web.spec[0].selector
    }

    template {
      metadata {
        labels = data.kubernetes_service.web.spec[0].selector
        annotations = {
          nginx_config = sha1(jsonencode(kubernetes_config_map.nginx_config.data))
          ssl_cert = sha1(jsonencode(kubernetes_secret.ssl.data))
        }
      }

      spec {
        container {
          image = "nginx"
          name  = "nginx"

          resources {
            limits {
              cpu    = "0.5"
              memory = "512Mi"
            }
            
            requests {
              cpu    = "250m"
              memory = "50Mi"
            }
          }

          volume_mount {
            name       = "config"
            mount_path = "/etc/nginx/conf.d/default.conf"
            sub_path   = "default.conf"
            read_only  = true
          }

          volume_mount {
            name       = "ssl"
            mount_path = "/ssl"
            read_only  = true
          }

          volume_mount {
            name       = "staticwebsite"
            mount_path = "/repo/"
            read_only  = true
          }

          port {
            container_port = 80
            protocol       = "TCP"
          }

          port {
            container_port = 443
            protocol       = "TCP"
          }
        }

        container {
          name  = "sidecar"
          image = "alpine/git"

          command = ["sh"]
          args = ["-c","/start.sh"]

          resources {
            limits {
              cpu    = "100m"
              memory = "100Mi"
            }
            
            requests {
              cpu    = "100m"
              memory = "10Mi"
            }
          }

          volume_mount {
            name       = "staticwebsite"
            mount_path = "/git"
            read_only  = false
          }

          volume_mount {
            name       = "clonescript"
            mount_path = "/start.sh"
            sub_path   = "start.sh"
            read_only  = true
          }

          env {
            name  = "GIT_REPO"
            value = "https://github.com/drgroot/chess.git"
          }

          env {
            name  = "GIT_DESTINATION"
            value = "/git/html" 
          }

          env {
            name  = "GIT_BRANCH"
            value = "gh-pages"
          }

          env {
            name  = "STATICHASH"
            value = var.WEB_HASH
          }
        }

        volume {
          name  = "staticwebsite"
          empty_dir {}
        }

        volume {
          name   = "config"
          config_map {
            name = kubernetes_config_map.nginx_config.metadata[0].name
          }
        }

        volume {
          name   = "clonescript"
          config_map {
            default_mode = "0555"
            name         = kubernetes_config_map.sidecarscript.metadata[0].name
          }
        }

        volume {
          name   = "ssl"
          secret {
            secret_name = kubernetes_secret.ssl.metadata[0].name
          } 
        }
      }
    }
  }
}
