// Where the visitor came from, read from the URL. Pure, so it is unit-tested.
// With cookieless tracking nothing survives a page load, so the guide page
// gets v + utm_* through its URL (see guideUrl).

const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export function pageContext(search) {
  const p = new URLSearchParams(search);
  const v = p.get('v');
  const utm = {};
  for (const k of UTM) if (p.get(k)) utm[k] = p.get(k);
  return {
    // which ad sent the visitor; "none" for direct/organic, never a guess
    ad_version: v === 'a' || v === 'b' ? v : 'none',
    // which first screen was shown; A is the default copy
    hero_variant: v === 'b' ? 'b' : 'a',
    utm,
  };
}

export function guideUrl(search, etf) {
  const { ad_version, utm } = pageContext(search);
  const q = new URLSearchParams();
  if (etf) q.set('etf', etf);
  if (ad_version !== 'none') q.set('v', ad_version);
  for (const [k, val] of Object.entries(utm)) q.set(k, val);
  const s = q.toString();
  return '/pruvodce' + (s ? '?' + s : '');
}
