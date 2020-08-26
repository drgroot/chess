# SCRAPERS
# These are scrapers that run as cronjobs on the kuber cluster
# They run daily to scrape games into the database 

# chess.com scraper
data "docker_registry_image" "scraper_chesscom" {
  name = "yusufali/chess_chesscom"
}
resource "kubernetes_cron_job" "scraper_chesscom" {
  metadata {
    name = "scraper-chesscom"
    namespace = "chess"
  }

  spec {
    concurrency_policy = "Allow"
    schedule           =  "5 */3 * * *"

    job_template {
      metadata {}

      spec {
        completions = 1
        parallelism = 1

        template {
          metadata {}
          spec {
            container {
              name  = "scraper-chesscom"
              image = "${data.docker_registry_image.scraper_chesscom.name}@${data.docker_registry_image.scraper_chesscom.sha256_digest}"

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

            restart_policy = "OnFailure"
          }
        }
      }
    }
  }
}