// Funnel tracking. PostHog EU, cookieless (persistence: 'memory'), loaded
// after first paint so it never delays the hero. Events fired before the
// library is ready are queued. Every event carries ad_version + UTM params.

const POSTHOG_KEY = 'phc_teSZs9GMdMZGxaJwnCqeBUuQqx56hfMFiTQyLGSPm8de'; // public project key (safe to commit)
const POSTHOG_HOST = 'https://eu.i.posthog.com';
const POSTHOG_SRC = 'https://cdn.jsdelivr.net/npm/posthog-js@1.434.15/dist/module.js';

const params = new URLSearchParams(location.search);
export const adVersion = params.get('v') === 'b' ? 'b' : 'a';

const superProps = { ad_version: adVersion };
for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
  if (params.get(k)) superProps[k] = params.get(k);
}

const queue = [];
const once = new Set();
let ph = null;

// Exposed for local testing: window.__events lists every event sent.
window.__events = [];

export function track(name, props = {}, { onlyOnce = false } = {}) {
  if (onlyOnce) {
    if (once.has(name)) return;
    once.add(name);
  }
  const p = { ...superProps, ...props };
  window.__events.push([name, p]);
  if (ph) ph.capture(name, props);
  else queue.push([name, props]);
}

function load() {
  if (!POSTHOG_KEY) { console.info('[track] no PostHog key, events only in window.__events'); return; }
  import(POSTHOG_SRC).then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'memory',        // no cookies, no localStorage
      autocapture: false,           // only the named funnel events
      capture_pageview: false,      // we send our own page_view
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: 'identified_only',
    });
    posthog.register(superProps);
    ph = posthog;
    for (const [n, p] of queue.splice(0)) ph.capture(n, p);
  }).catch((e) => console.warn('[track] PostHog failed to load', e));
}

if (document.readyState === 'complete') setTimeout(load, 0);
else addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 2000 }) : setTimeout(load, 200)));
