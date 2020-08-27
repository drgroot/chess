#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
$DIR/pre.sh $1 $2
cd $1

if [ -f services.sh ]; then
  ./services.sh $1 $2
else
  $DIR/cicd/services.sh
fi

# NPM Version Check
REPO=$(basename $1)
PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
PUBLISHED_VERSION=$(npm view chess_$REPO version)
if [ "$PUBLISHED_VERSION" == "$PACKAGE_VERSION" ]; then
  echo "$REPO need to increment version!"
  exit 1; 
fi

npm test
