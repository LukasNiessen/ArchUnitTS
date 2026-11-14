const { copyFileSync, mkdirSync } = require('fs');

const source = 'src/testing/vitest/types';
const destination = `dist/${source}`;
mkdirSync(destination, { recursive: true });
for (const file of ['index.d.ts', 'package.json']) {
	copyFileSync(`${source}/${file}`, `${destination}/${file}`);
}
