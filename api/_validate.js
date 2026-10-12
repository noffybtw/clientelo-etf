// Lead validation, shared by the API function and the tests.
// Files starting with "_" in /api are not deployed as endpoints by Vercel.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ETFS = new Set(['voo', 'spy', 'qqq', 'ivv', 'vt', 'schd', 'none']);
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateLead(body) {
  const b = body && typeof body === 'object' ? body : {};
  if (str(b.company, 200)) return { ok: false, spam: true };

  const email = str(b.email, 300).toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, error: 'email' };
  if (b.consent !== true) return { ok: false, error: 'consent' };

  const lead = {
    email,
    consent: true,
    etf: ETFS.has(b.etf) ? b.etf : '',
    ad_version: b.ad_version === 'a' || b.ad_version === 'b' ? b.ad_version : '',
  };
  for (const k of UTM) lead[k] = str(b[k], 100);
  return { ok: true, lead };
}
