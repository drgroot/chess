#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
$DIR/pre.sh $1 $2
cd $1

npm run-script build

if [ ! -z $NPM_TOKEN ]; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
  npm publish
fi