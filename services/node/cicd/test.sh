#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
$DIR/pre.sh $1 $2
cd $1

if [ -f services.sh ]; then
  ./services.sh
else
  $2/cicd/services.sh
fi

npm test