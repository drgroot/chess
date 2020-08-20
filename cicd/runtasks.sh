#!/usr/bin/env bash
set -e

PACKAGES=()
ALLOWED_PACKAGES=()

for group; do
  ALLOWED_PACKAGES+=($group)
done

get_changed_packages (){
  # this function gets the changed packages it will do this by defining a package
  # as a folder that has a 'package-lock.json' file. this definition will change as 
  # more types of packages are supported
  for changed_file in $(git log -1 --name-only --oneline); do
    # determine which package it is
    path=$(dirname $changed_file)
    while [ "$path" != "." ]; do
      if [ -f "$path/package-lock.json" ]; then
        if [[ ! " ${PACKAGES[@]} " =~ " ${path} " ]]; then
          # make sure package is in list of allowed packages
          for package in "${ALLOWED_PACKAGES[@]}"; do
            if [[ $path == $package* ]]; then
              PACKAGES+=($path)
            fi
          done
        fi

        break
      fi
      path=$(dirname $path) 
    done
  done
}

get_build_script(){
  # this function takes a package as input and finds the closest parent
  # that contains the build script. an interesting case can occure where
  # there is no parent
  package="$1"

  while [ "$package" != "." ]; do
    if [ -f "$package/cicd/$STAGE.sh" ]; then
      echo "$package/cicd/$STAGE.sh"
      return 0
    fi
    package=$(dirname $package)
  done
}

# MAIN

# if not stage is not defined, exit hard
if [ -z $STAGE ]; then
  echo "Job stage is not defined"
  exit 1;
fi

# get list of packages that have been updated and required to go
# through the build process. 
get_changed_packages

# find build script and identify parent for build script
cwd=$(pwd)
for child in "${PACKAGES[@]}"; do
  # get build script for current stage
  build_script=$(get_build_script $child)
  if [ "$build_script" = "" ]; then
    echo "No $STAGE script for package: $child"
    exit 1;
  fi

  # identify parent
  parent=$(get_build_script $(dirname $child))
  if [ "$parent" = "" ]; then
    echo "No parent found for package: $child"
    exit 1;
  fi
  parent=$(dirname $(dirname $parent))

  # execute build script
  echo "Running: $cwd/$build_script $cwd/$child $cwd/$parent"
  eval "$cwd/$build_script $cwd/$child $cwd/$parent"
done
