// Funnel tracking. PostHog EU, cookieless (persistence: 'memory'), loaded
// after first paint so it never delays the hero. Events fired before the
// library is ready are queued. Every event carries ad_version, hero_variant
// and UTM params, read from the URL on every page (see context.js).
import { pageContext } from './context.js';

const POSTHOG_KEY = 'phc_teSZs9GMdMZGxaJwnCqeBUuQqx56hfMFiTQyLGSPm8de'; // public project key (safe to commit)
const POSTHOG_HOST = 'https://eu.i.posthog.com';
const POSTHOG_SRC = 'https://cdn.jsdelivr.net/npm/posthog-js@1.434.15/dist/module.js';

const ctx = pageContext(location.search);
export const adVersion = ctx.ad_version;
export const heroVariant = ctx.hero_variant;

const superProps = { ad_version: ctx.ad_version, hero_variant: ctx.hero_variant, ...ctx.utm };

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
  // Local test runs must never reach the production project.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) { console.info('[track] local host, PostHog not loaded; events only in window.__events'); return; }
  import(POSTHOG_SRC).then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'memory',        // no cookies, no localStorage
      autocapture: false,           // only the named funnel events
      capture_pageview: false,      // we send our own page_view
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,        // we run no surveys; saves a script download
      person_profiles: 'identified_only',
    });
    posthog.register(superProps);
    ph = posthog;
    for (const [n, p] of queue.splice(0)) ph.capture(n, p);
  }).catch((e) => console.warn('[track] PostHog failed to load', e));
}

if (document.readyState === 'complete') setTimeout(load, 0);
else addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 2000 }) : setTimeout(load, 200)));
