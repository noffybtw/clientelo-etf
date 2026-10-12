import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead } from '../api/_validate.js';

const ok = { email: 'jana.novakova@seznam.cz', consent: true, company: '', etf: 'voo', ad_version: 'a' };

test('accepts a normal lead and normalises it', () => {
  const r = validateLead({ ...ok, email: '  Jana.Novakova@Seznam.cz ', utm_source: 'facebook' });
  assert.equal(r.ok, true);
  assert.equal(r.lead.email, 'jana.novakova@seznam.cz');
  assert.equal(r.lead.utm_source, 'facebook');
  assert.equal(r.lead.consent, true);
});

test('rejects a missing or malformed email', () => {
  for (const email of ['', 'jana', 'jana@', '@seznam.cz', 'jana@seznam', 'a b@c.cz', 'x'.repeat(250) + '@a.cz']) {
    assert.equal(validateLead({ ...ok, email }).ok, false, email);
  }
});

test('rejects a lead without consent', () => {
  assert.equal(validateLead({ ...ok, consent: false }).ok, false);
  assert.equal(validateLead({ ...ok, consent: 'true' }).ok, false);
});

test('flags a filled honeypot as spam', () => {
  const r = validateLead({ ...ok, company: 'ACME s.r.o.' });
  assert.equal(r.ok, false);
  assert.equal(r.spam, true);
});

test('keeps only known fields and caps their length', () => {
  const r = validateLead({ ...ok, etf: 'voo<script>', evil: 'x', utm_campaign: 'c'.repeat(500) });
  assert.equal(r.ok, true);
  assert.equal('evil' in r.lead, false);
  assert.equal(r.lead.etf, '');
  assert.equal(r.lead.utm_campaign.length, 100);
});

test('ad_version is a or b only', () => {
  assert.equal(validateLead({ ...ok, ad_version: 'zzz' }).lead.ad_version, '');
  assert.equal(validateLead({ ...ok, ad_version: 'b' }).lead.ad_version, 'b');
});
