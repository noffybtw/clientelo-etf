// Copies the single source of truth data/etfs.json into the static site.
// Fails the build if any number shown on the page has no source URL.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('data/etfs.json', 'utf8'));

const missing = [];
const walk = (o, path) => {
  if (o && typeof o === 'object' && 'value' in o && 'source_url' in o) {
    if (o.value !== null && !o.source_url) missing.push(path);
    return;
  }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
};
walk(data, 'data');
if (missing.length) {
  console.error('Fields with a value but no source_url:\n' + missing.join('\n'));
  process.exit(1);
}

mkdirSync('public/data', { recursive: true });
writeFileSync('public/data/etfs.json', JSON.stringify(data));
console.log(`build: ${data.pairs.length} pairs copied, every value has a source`);
