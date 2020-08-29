#!/usr/bin/env bash

npm config set unsafe-perm true

eval "$2/cicd/test.sh $1 $2"