data "kubernetes_service" "rabbitmq" {
  metadata {
    name = "chess-rabbitmq"
    namespace = "chess"
  }
}

resource "kubernetes_secret" "rabbitmq" {
  metadata {
    name = "rabbitmq-url"
    namespace = "chess"
  }

  data = {
    RABBITMQ = "amqp://${data.kubernetes_service.rabbitmq.metadata[0].name}.chess.svc.cluster.local:${data.kubernetes_service.rabbitmq.spec[0].port[0].port}/${kubernetes_deployment.rabbitmq.spec[0].template[0].spec[0].container[0].env[0].value}"
  }
}

resource "kubernetes_deployment" "rabbitmq" {
  metadata {
    name = "rabbitmq"
    namespace = "chess"
  }

  spec {
    replicas = 1
    min_ready_seconds = "30"
    
    selector {
      match_labels = data.kubernetes_service.rabbitmq.spec[0].selector
    }

    template {
      metadata {
        labels = data.kubernetes_service.rabbitmq.spec[0].selector
      }

      spec {
        container {
          image = "rabbitmq:3.8.4-alpine"
          name  = "rabbitmq"

          resources {
            limits {
              cpu = "2000m"
              memory = "2Gi"
            }
            requests {
              cpu = "200m"
              memory = "50Mi"
            }
          }

          env {
            name  = "RABBITMQ_DEFAULT_VHOST"
            value = "asdad"
          }

          port {
            container_port = 5672
            protocol       = "TCP"
          }
        }
      }
    }
  }
}