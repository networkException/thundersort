tsc -p tsconfig.json
sed -i '2d' dist/background.js # Remove Object.defineProperty(exports, "__esModule", { value: true });
rm thundersort.zip
zip thundersort.zip * 