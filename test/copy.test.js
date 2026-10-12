// The numbers in the ad B copy and the ?v=b hero are hard-coded for speed.
// This test fails if the data or the calculator change and the copy does not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareCosts } from '../public/js/calc.js';

const bank = JSON.parse(readFileSync('data/bank_fund.json', 'utf8'));
const etfs = JSON.parse(readFileSync('data/etfs.json', 'utf8'));
const vuaa = etfs.pairs.find((p) => p.id === 'voo').twin;
const c = compareCosts({
  monthly: 3000, years: 20, returnPct: 7,
  a: { ongoingPct: vuaa.ter_pct.value, entryPct: 0 },
  b: { ongoingPct: bank.ongoing_pct.value, entryPct: bank.entry_pct.value },
});
const fmt = (n) => new Intl.NumberFormat('cs-CZ').format(Math.round(n / 100) * 100).replace(/\s/g, ' ');
const norm = (s) => s.replace(/&nbsp;| | /g, ' ');

for (const file of ['public/index.html', 'ads/ad-b.md', 'ads/ad-b.html']) {
  test(`${file} quotes the current calculator result`, () => {
    const text = norm(readFileSync(file, 'utf8'));
    assert.ok(text.includes(fmt(c.b.lostToCosts) + ' Kč'), `bank figure ${fmt(c.b.lostToCosts)} Kč missing`);
    assert.ok(text.includes(fmt(c.a.lostToCosts) + ' Kč'), `ETF figure ${fmt(c.a.lostToCosts)} Kč missing`);
  });
}

test('variant B hero bars are drawn to scale (ETF width = ETF fees / bank fees)', () => {
  const html = readFileSync('public/index.html', 'utf8');
  const pct = ((c.a.lostToCosts / c.b.lostToCosts) * 100).toFixed(2);
  assert.ok(html.includes(`<div class="hb-fill" style="width:${pct}%"></div>`), `ETF bar should be ${pct}% wide`);
  assert.ok(html.includes('<div class="hb-fill" style="width:100%"></div>'), 'bank bar should be full width');
});
