#!/usr/bin/env bash
set -e

docker run -d --link=rabbitmq -e RABBITMQ=$RABBIT --name pgnextract yusufali/chess_pgnextract || true

eval "$2/cicd/services.sh $1 $2"