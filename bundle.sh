tsc -p tsconfig.json
sed '2d' dist/background.js
rm thundersort.zip
zip thundersort.zip * 