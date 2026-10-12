import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectSavings, compareCosts } from '../public/js/calc.js';

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('zero return and zero costs returns exactly what was paid in', () => {
  const r = projectSavings({ monthly: 1000, years: 10, returnPct: 0, ongoingPct: 0, entryPct: 0 });
  assert.equal(r.paidIn, 120000);
  close(r.value, 120000);
});

test('no costs matches the closed-form annuity (deposit at month end)', () => {
  const m = Math.pow(1.07, 1 / 12) - 1;
  const expected = 2000 * ((Math.pow(1 + m, 240) - 1) / m);
  const r = projectSavings({ monthly: 2000, years: 20, returnPct: 7, ongoingPct: 0, entryPct: 0 });
  close(r.value, expected);
});

test('entry fee is taken from every deposit', () => {
  const r = projectSavings({ monthly: 1000, years: 2, returnPct: 0, ongoingPct: 0, entryPct: 3 });
  close(r.value, 24000 * 0.97);
});

test('ongoing cost is applied to assets every month', () => {
  // one deposit worth of check: 0 % return, 12 % yearly cost, 1 year
  const r = projectSavings({ monthly: 1000, years: 1, returnPct: 0, ongoingPct: 12, entryPct: 0 });
  const f = Math.pow(0.88, 1 / 12);
  let v = 0;
  for (let i = 0; i < 12; i++) v = v * f + 1000;
  close(r.value, v);
});

test('higher costs always give a lower value', () => {
  const base = { monthly: 3000, years: 15, returnPct: 7, entryPct: 0 };
  const cheap = projectSavings({ ...base, ongoingPct: 0.07 });
  const pricey = projectSavings({ ...base, ongoingPct: 1.8 });
  assert.ok(cheap.value > pricey.value);
});

test('compareCosts reports what each fund loses to costs vs a zero-cost baseline', () => {
  const c = compareCosts({
    monthly: 2000, years: 20, returnPct: 7,
    a: { ongoingPct: 0.07, entryPct: 0 },
    b: { ongoingPct: 1.8, entryPct: 3 },
  });
  assert.equal(c.paidIn, 480000);
  close(c.a.lostToCosts, c.gross - c.a.value);
  close(c.b.lostToCosts, c.gross - c.b.value);
  close(c.difference, c.a.value - c.b.value);
  assert.ok(c.b.lostToCosts > c.a.lostToCosts * 10);
});

test('rejects nonsense input', () => {
  assert.throws(() => projectSavings({ monthly: -1, years: 10, returnPct: 7, ongoingPct: 0, entryPct: 0 }), RangeError);
  assert.throws(() => projectSavings({ monthly: 1000, years: 0, returnPct: 7, ongoingPct: 0, entryPct: 0 }), RangeError);
  assert.throws(() => projectSavings({ monthly: NaN, years: 10, returnPct: 7, ongoingPct: 0, entryPct: 0 }), RangeError);
  assert.throws(() => projectSavings({ monthly: 1000, years: 10, returnPct: 7, ongoingPct: 0, entryPct: 100 }), RangeError);
});
