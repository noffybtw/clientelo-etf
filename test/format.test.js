import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { terPct } from '../public/js/format.js';

const NB = ' ';

test('TER shows at least two decimals with a Czech comma', () => {
  assert.equal(terPct(0.3), `0,30${NB}%`);
  assert.equal(terPct(0.07), `0,07${NB}%`);
  assert.equal(terPct(0.03), `0,03${NB}%`);
  assert.equal(terPct(0.14), `0,14${NB}%`);
  assert.equal(terPct(1), `1,00${NB}%`);
});

test('TER keeps extra precision when the source has it', () => {
  assert.equal(terPct(0.0945), `0,0945${NB}%`);
});

test('every TER in the dataset formats with two or more decimals', () => {
  const d = JSON.parse(readFileSync('data/etfs.json', 'utf8'));
  for (const p of d.pairs) {
    for (const fund of [p.us, p.twin || p.proxy]) {
      const s = terPct(fund.ter_pct.value);
      assert.match(s, /^\d+,\d{2,} %$/, `${fund.ticker}: ${s}`);
    }
  }
});
