#!/bin/bash

cd $1
npm install

npm audit
npm eslint src