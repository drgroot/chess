#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
$DIR/pre.sh $1
cd $1

REPO=$(basename $1)
IMAGE="yusufali/chess_$REPO"

docker build --network host -t $IMAGE .
if [ ! -z $DOCKER_PASSWORD ]; then docker push $IMAGE; fi