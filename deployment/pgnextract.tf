data "docker_registry_image" "pgnextract" {
  name = "yusufali/chess_pgnextract"
}

resource "kubernetes_deployment" "pgnextract" {
  metadata {
    name = "pgnextract"
    namespace = "chess"
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = { app="pgnextract" }
    }

    template {
      metadata {
        labels = { app="pgnextract" }

        annotations = {
          rabbitmq = sha1(jsonencode(kubernetes_secret.rabbitmq.data))
          slackurl = sha1(jsonencode(kubernetes_secret.slack_url.data))
        }
      }

      spec {
        container {
          image = "${data.docker_registry_image.pgnextract.name}@${data.docker_registry_image.pgnextract.sha256_digest}"
          image_pull_policy = "Always"
          name  = "pgnextract"

          resources {
            limits {
              cpu = "500m"
              memory = "400Mi"
            }

            requests {
              cpu = "50m"
              memory = "50Mi"
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

resource "kubernetes_horizontal_pod_autoscaler" "pgnextract" {
  metadata {
    name = kubernetes_deployment.pgnextract.metadata[0].name
    namespace = "chess"
  }

  spec {
    min_replicas = 1
    max_replicas = 10
  
    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = kubernetes_deployment.pgnextract.metadata[0].name
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