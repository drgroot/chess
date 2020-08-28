data "kubernetes_service" "webapi" {
  metadata {
    name = "chess-webapi"
    namespace = "chess"
  }
}

data "docker_registry_image" "webapi" {
  name = "nginx"
}

resource "kubernetes_deployment" "web_api" {
  metadata {
    name = "web-api"
    namespace = "chess"
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = data.kubernetes_service.webapi.spec[0].selector
    }

    template {
      metadata {
        labels = data.kubernetes_service.webapi.spec[0].selector
        
        annotations = {
          rabbitmq = sha1(jsonencode(kubernetes_secret.rabbitmq.data))
          slackurl = sha1(jsonencode(kubernetes_secret.slack_url.data))
          redis = sha1(jsonencode(kubernetes_secret.redis.data))
        }
      }

      spec {
        container {
          image = "${data.docker_registry_image.webapi.name}@${data.docker_registry_image.webapi.sha256_digest}"
          image_pull_policy = "Always"
          name  = "web-api"

          resources {
            limits {
              cpu = "2"
              memory = "1Gi"
            }

            requests {
              cpu = "100m"
              memory = "50Mi"
            }
          }
          
          env {
            name  = "SESSION_SECRET"
            value = var.SESSION_SECRET
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.rabbitmq.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.redis.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.slack_url.metadata[0].name
            }
          }

          port {
            container_port = 3000
            protocol       = "TCP"
          }
        }
      }
    }
  }
}

resource "kubernetes_horizontal_pod_autoscaler" "web_api" {
  metadata {
    name = kubernetes_deployment.web_api.metadata[0].name
    namespace = "chess"
  }

  spec {
    min_replicas = 1
    max_replicas = 10
  
    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = kubernetes_deployment.web_api.metadata[0].name
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
