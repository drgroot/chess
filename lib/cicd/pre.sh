#!/usr/bin/env bash
set -e

cd $1
npm i -g dry-dry
dry install --dry-save-package-json-to . || true
npm install

if [ ! -f .babelrc ]; then
  cp $2/../com/node/cicd/lib/.babelrc .
fi

if [ ! -f .eslintrc.json ]; then
  cp $2/../com/node/cicd/lib/.eslintrc.json .
fi

if [ ! -f .npmignore ]; then
  cp $2/cicd/.npmignore .
fi