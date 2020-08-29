#!/usr/bin/env bash
set -e

apk add zlib
eval "$2/cicd/pre.sh $1 $2"
cd $1
npm run build

