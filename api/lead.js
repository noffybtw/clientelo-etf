// POST /api/lead -> validates, then appends the lead to a Google Sheet via an
// Apps Script web app (LEAD_WEBHOOK_URL). The script has no mail permission;
// the shared secret stops anyone else from writing into the sheet.
import { validateLead } from './_validate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const v = validateLead(req.body);
  // Bots that fill the honeypot get a fake success and nothing is stored.
  if (v.spam) return res.status(200).json({ ok: true });
  if (!v.ok) return res.status(400).json({ ok: false, error: v.error });

  const url = process.env.LEAD_WEBHOOK_URL;
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error('lead: LEAD_WEBHOOK_URL or LEAD_WEBHOOK_SECRET is not set');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...v.lead, secret, consent_text_version: '2026-10-12', received_at: new Date().toISOString() }),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || out.ok !== true) throw new Error(`sheet responded ${r.status} ${JSON.stringify(out)}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead: storing failed', err);
    return res.status(502).json({ ok: false, error: 'store_failed' });
  }
}
