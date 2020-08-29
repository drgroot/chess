#!/usr/bin/env sh
set -e

rm -rf pgn-extract || true
tar xzvf pgn-extract.tgz
cd pgn-extract
make
cd ..
mkdir -p dist

if [ -d src ]; then 
  cp pgn-extract/pgn-extract src/.
fi

cp pgn-extract/pgn-extract dist/.
rm -rf pgn-extract