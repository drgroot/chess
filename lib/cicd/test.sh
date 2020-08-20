#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $1

REPO=$(basename $1)
npm install

# NPM Version Check
PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
PUBLISHED_VERSION=$(npm view chess_$REPO version)
if [ "$PUBLISHED_VERSION" == "$PACKAGE_VERSION" ]; then exit 1; fi