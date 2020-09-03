resource "kubernetes_secret" "database_url" {
  metadata {
    name  = "database-url"
    namespace = "chess"
  }

  data = {
    MONGODB = var.MONGO_URL
  }
}

data "docker_registry_image" "dbapi" {
  name = "yusufali/chess_dbapi"
}

resource "kubernetes_deployment" "database_api" {
  metadata {
    name = "database-api"
    namespace = "chess"
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = { app="database-api" }
    }

    template {
      metadata {
        labels = { app="database-api" }
        
        annotations = {
          database = sha1(jsonencode(kubernetes_secret.database_url.data))
          rabbitmq = sha1(jsonencode(kubernetes_secret.rabbitmq.data))
          slackurl = sha1(jsonencode(kubernetes_secret.slack_url.data))
        }
      }

      spec {
        container {
          image = "${data.docker_registry_image.dbapi.name}@${data.docker_registry_image.dbapi.sha256_digest}"
          image_pull_policy = "Always"
          name  = "database-api"

          resources {
            limits {
              cpu = "1"
              memory = "4Gi"
            }

            requests {
              cpu = "500m"
              memory = "800Mi"
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.database_url.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.rabbitmq.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.slack_url.metadata[0].name
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_horizontal_pod_autoscaler" "database_api" {
  metadata {
    name = kubernetes_deployment.database_api.metadata[0].name
    namespace = "chess"
  }

  spec {
    min_replicas = 1
    max_replicas = 10
  
    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = kubernetes_deployment.database_api.metadata[0].name
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