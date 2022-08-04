#!/bin/bash

rm -r dist
npx tsc -p tsconfig.json
cp src/*.html dist/
rm thundersort.zip
zip -qqr thundersort.zip README.md LICENSE manifest.json package.json package-lock.json tsconfig.json src dist
