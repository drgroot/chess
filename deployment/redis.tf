data "kubernetes_service" "redis" {
  metadata {
    name = "chess-redis"
    namespace = "chess"
  }
}

resource "kubernetes_secret" "redis" {
  metadata {
    name      = "redis-url"
    namespace = "chess"
  }

  data = {
    REDIS_URL = "redis://${data.kubernetes_service.redis.metadata[0].name}.chess.svc.cluster.local:${data.kubernetes_service.redis.spec[0].port[0].port}"
  }
}

resource "kubernetes_deployment" "redis" {
  metadata {
    name = "redis"
    namespace = "chess"
  }

  spec {
    replicas = 1
    
    selector {
      match_labels = data.kubernetes_service.redis.spec[0].selector
    }

    template {
      metadata {
        labels = data.kubernetes_service.redis.spec[0].selector
      }

      spec {
        container {
          image = "redis:6.0.4-alpine"
          name  = "redis"

          command = [
            "redis-server",
            "--maxmemory","209715200",
            "--maxmemory-policy","allkeys-lru"
          ]

          resources {
            limits {
              cpu = "1"
              memory = "0.5Gi"
            }
            requests {
              cpu = "100m"
              memory = "50Mi"
            }
          }

          port {
            container_port = 6379
            protocol       = "TCP"
          }
        }
      }
    }
  }
}