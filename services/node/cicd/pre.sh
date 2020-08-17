#!/usr/bin/env bash
set -e

cd $1

npm i -g dry-dry
dry install --dry-save-package-json-to . || true
npm install

if [ ! -f .babelrc ]; then
  cp ../cicd/lib/.babelrc .
fi

if [ ! -f .eslintrc.json ]; then
  cp ../cicd/lib/.eslintrc.json .
fi

if [ ! -f Dockerfile ]; then 
  cp ../cicd/lib/Dockerfile .
fi

if [ ! -f .dockerignore ]; then
  cp ../cicd/lib/.dockerignore .
fi

if [ ! -f src/log.js ]; then
  cp ../log.js src/.
fi

if [ ! -f src/rabbitmq.js ]; then
  cp ../rabbitmq.js src/.
fi