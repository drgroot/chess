#!/bin/bash

cd $1

REPO=$(basename $1)
IMAGE="chess_$REPO"

# check for overrides
if [ ! -f Dockerfile ]; then 
  cp ../cicd/Dockerfile .
fi

if [ ! -f .dockerignore ]; then
  cp ../cicd/.dockerignore .
fi

docker build --network host -t $IMAGE .
if [ ! -z $DOCKER_PASSWORD ]; then docker push $IMAGE; fi