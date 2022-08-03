#!/bin/bash

tsc -p tsconfig.json
sed -i '2d' dist/background.js # Remove Object.defineProperty(exports, "__esModule", { value: true });
sed -i '2d' dist/options/index.js
cp options/index.html dist/options/index.html
rm thundersort.zip
zip -qqr thundersort.zip dist options LICENSE manifest.json README.md
