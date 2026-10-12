import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageContext, guideUrl } from '../public/js/context.js';

test('ad_version comes only from ?v=a|b; anything else is "none", not "a"', () => {
  assert.equal(pageContext('?v=b').ad_version, 'b');
  assert.equal(pageContext('?v=a').ad_version, 'a');
  assert.equal(pageContext('').ad_version, 'none');
  assert.equal(pageContext('?v=zzz').ad_version, 'none');
});

test('hero_variant records which first screen was shown (A is the default)', () => {
  assert.equal(pageContext('?v=b').hero_variant, 'b');
  assert.equal(pageContext('').hero_variant, 'a');
});

test('utm_* params are picked up, others ignored', () => {
  const c = pageContext('?v=b&utm_source=test&utm_campaign=x&fbclid=123');
  assert.deepEqual(c.utm, { utm_source: 'test', utm_campaign: 'x' });
});

test('guide URL carries v and utm_* to the next page, plus the picked ETF', () => {
  const u = new URL(guideUrl('?v=b&utm_source=test&utm_content=b_fees&fbclid=123', 'qqq'), 'https://x.test');
  assert.equal(u.pathname, '/pruvodce');
  assert.equal(u.searchParams.get('etf'), 'qqq');
  assert.equal(u.searchParams.get('v'), 'b');
  assert.equal(u.searchParams.get('utm_source'), 'test');
  assert.equal(u.searchParams.get('utm_content'), 'b_fees');
  assert.equal(u.searchParams.get('fbclid'), null);
});

test('guide URL without ad params stays clean', () => {
  assert.equal(guideUrl('', 'voo'), '/pruvodce?etf=voo');
  assert.equal(guideUrl('?v=zzz', ''), '/pruvodce');
});
