import { test, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/lead.js';

function res() {
  return {
    code: 0, body: null, headers: {},
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; },
    setHeader(k, v) { this.headers[k] = v; },
  };
}
const good = { email: 'a@b.cz', consent: true, company: '', etf: 'voo', ad_version: 'b' };

beforeEach(() => {
  process.env.LEAD_WEBHOOK_URL = 'https://script.example/exec';
  process.env.LEAD_WEBHOOK_SECRET = 's3cret';
  mock.restoreAll();
  console.error = () => {};
});

test('GET is not allowed', async () => {
  const r = res();
  await handler({ method: 'GET' }, r);
  assert.equal(r.code, 405);
});

test('honeypot: fake success, nothing forwarded', async () => {
  const f = mock.method(globalThis, 'fetch', async () => { throw new Error('should not be called'); });
  const r = res();
  await handler({ method: 'POST', body: { ...good, company: 'x' } }, r);
  assert.equal(r.code, 200);
  assert.equal(f.mock.callCount(), 0);
});

test('invalid email: 400', async () => {
  const r = res();
  await handler({ method: 'POST', body: { ...good, email: 'nope' } }, r);
  assert.equal(r.code, 400);
});

test('missing config: 500, never a fake success', async () => {
  delete process.env.LEAD_WEBHOOK_URL;
  const r = res();
  await handler({ method: 'POST', body: good }, r);
  assert.equal(r.code, 500);
});

test('valid lead is forwarded with the secret', async () => {
  const f = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
  const r = res();
  await handler({ method: 'POST', body: good }, r);
  assert.equal(r.code, 200);
  const sent = JSON.parse(f.mock.calls[0].arguments[1].body);
  assert.equal(sent.secret, 's3cret');
  assert.equal(sent.email, 'a@b.cz');
  assert.equal(sent.ad_version, 'b');
});

test('sheet rejects (wrong secret): 502', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 200 }));
  const r = res();
  await handler({ method: 'POST', body: good }, r);
  assert.equal(r.code, 502);
});
