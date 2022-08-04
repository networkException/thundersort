#!/bin/bash

rm -r dist
npx tsc -p tsconfig.json
cp options/index.html dist/options/index.html
cp background.html dist/background.html
rm thundersort.zip
zip -qqr thundersort.zip dist options LICENSE manifest.json README.md package.json package-lock.json types background.ts tsconfig.json
