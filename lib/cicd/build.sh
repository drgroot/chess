#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $1

echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm install
npm run-script build

if [ ! -z $NPM_TOKEN ]; then
  npm publish
fi