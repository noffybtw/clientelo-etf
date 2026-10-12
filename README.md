# ETF dvojčata: lead-magnet landing page (Clientelo test task B)

**Live:** https://clientelo-etf.vercel.app (variant A: [`/?v=a`](https://clientelo-etf.vercel.app/?v=a), variant B: [`/?v=b`](https://clientelo-etf.vercel.app/?v=b))
**Ads:** [`ads/ad-a.md`](ads/ad-a.md), [`ads/ad-b.md`](ads/ad-b.md) (copy, creatives, UTM links)
**Decisions:** [`DECISIONS.md`](DECISIONS.md) · **AI log:** [`NOTES-ai.md`](NOTES-ai.md) and [`ai-log/`](ai-log/)

A Czech mobile landing page for people who know VOO, SPY or QQQ from YouTube and find their broker won't sell it.
1. One tap shows the European UCITS "twin" with the same index that they *can* buy.
2. The visitor sees what fees cost in korunas against a real Czech bank fund.
3. For an email, the visitor unlocks a 5-step guide to their first purchase.

## What was built

| Part | Where |
|---|---|
| Landing page: static HTML/CSS/JS, no framework, 6.2 kB of own JS gzipped (14.7 kB raw); PostHog loads after first paint | `public/index.html`, `public/js/app.js` |
| Two first-screen variants that match the two ads | `?v=a` / `?v=b` (data attributes in the hero) |
| Fee calculator (pure functions, unit-tested) | `public/js/calc.js` |
| Data: 6 US ETF → UCITS pairs, every field with its source URL and retrieval date | `data/etfs.json` |
| Bank fund for the comparison, from its KID | `data/bank_fund.json` |
| Build step that fails if any shown value has no source | `scripts/build.mjs` |
| Lead endpoint: validation, honeypot, forwards to a Google Sheet | `api/lead.js`, `backend/apps-script.gs` |
| Guide shown right after the form | `public/pruvodce.html` |
| Privacy page | `public/soukromi.html` |
| Funnel analytics (PostHog EU, cookieless) | `public/js/track.js` |
| Tests: calculator, validation, endpoint, ad copy ↔ data, page context | `test/` (`npm test`, 27 tests) |

## Audience and offer

**Audience:**
- Czech retail beginner, 25–40, on a phone, coming from an Instagram or Facebook ad.
- Has heard "buy the S&P 500" and a ticker or two.
- Has either hit the "this instrument is not available" message in a broker app, or keeps savings in a bank fund without having added up its fees.
- Gives the page a few seconds and does not know what UCITS or KID means.

**The insight the page is built on:**
- PRIIPs (Reg. (EU) 1286/2014, Art. 5(1), 13(1)) requires a KID before a fund is sold to retail investors.
- US issuers don't publish one, so most EU brokers block retail buys of VOO, SPY and QQQ. LYNX, Saxo and IBKR say so in their help pages.
- It is not absolute: the ČNB says execution-only brokers are outside Art. 13(1), and Fio banka does sell US ETFs. The page says this openly (DECISIONS D1).

**Value before the form, free and with no registration:**
- The twin ticker, its index, TER, accumulating or distributing, where it trades, ISIN and fund size.
- A fee calculator against ČSOB Akciový Amerika.
- The full comparison of 6 pairs, and a sourced explainer.

**What the email buys:** "Jak koupit první ETF z Česka v 5 krocích" (how to buy your first ETF from Czechia in 5 steps):
- choosing a broker, opening an account, buying by ISIN on Xetra, investing regularly, taxes;
- personalised with the ISIN of the fund the visitor picked.

The ask is about the *next step* (how to actually buy), not about the data the visitor already has.

**When we ask:** immediately after the result and calculator, which is the moment of highest intent. A second CTA sits at the end of the page.
- **Form:** email plus one consent checkbox, and a hidden honeypot.
- **After submit:** the visitor lands on the guide at once. Nothing is emailed in this demo (D4). In production, send the guide from a verified domain as double opt-in.

## Why the sections are in this order

| # | Section | Reason |
|---|---|---|
| 1 | Hero: the ad's promise, word for word, plus six ticker chips | The visitor checks in about 3 s that they are in the right place. The first tap is above the fold at 390 px (checked by screenshot), with no "learn more" scrolling. |
| 2 | Result card | The payoff of that tap: the value is proven before anything is asked. |
| 3 | Fee calculator inside the result | Turns 0.07 % vs 1.66 % into 299 300 Kč, the emotional peak of the page. |
| 4 | Form | Placed at the peak. The offer is the natural next question ("how do I buy it?"). |
| 5 | Comparison of all 6 pairs with sources | For the visitor who scrolls instead of converting: depth and trust. |
| 6 | "Why can't I buy VOO" explainer | Answers the sceptic and names the Fio exception: credibility over hype. |
| 7 | Second CTA, disclaimer, sources | Catches late converters. The legal text is visible but stays out of the way. |

**Design: "a bank statement, not a crypto ad"**
- Paper background, dark ink, one deep green, rust only for costs.
- A serif headline and tickers in monospace.
- No gradients, no emoji icons, no hero-plus-three-cards layout.

## Data and sources

- **Retrieval:** every value in `data/etfs.json` has `value`, `as_of`, `source_url`, `source_name`, `verified`. All were retrieved on 12 Oct 2026.
- **Primary sources:** issuer pages (Vanguard, iShares, State Street, Invesco, Schwab).
- **justETF:** used only as a cross-check, read by hand one page at a time. Its terms forbid automated price queries.
- **Bank fund:** costs are taken from the KID PDF (13 Feb 2026). The quoted lines are in `data/bank_fund.json`.
- **On the page:** each figure links to its source, and the build refuses a value without a source.
- **Known caveat:** fund size is reported differently by issuers (whole fund) and justETF (one share class). The page always shows the whole fund and says so.

## Measurement

**Tool:** PostHog Cloud EU, free plan (1M events/month, funnels included; checked on posthog.com/pricing on 12 Oct 2026).
- `persistence: 'memory'`: no cookies, no localStorage, so no consent banner.
- "Discard client IP data" is switched on (D5).

**Funnel events, in order:**

| Event | Fires when |
|---|---|
| `page_view` | page loads |
| `scroll_50` | half the page has been scrolled |
| `finder_used` | a ticker chip is tapped (`etf`) |
| `result_shown` | the twin card renders (`etf`, `twin`, `is_proxy`) |
| `calculator_used` | first slider or select change (amount, years, return) |
| `form_viewed` | 50 % of the form is in the viewport |
| `form_started` | first focus in the form |
| `form_submitted` | the server confirmed the lead was stored |

- **Extra events:** `form_error` and `guide_viewed`.
- **Ad version:** every event carries `ad_version`, `hero_variant` and all `utm_*` parameters as super-properties.
  - `ad_version` is `a` or `b` from `?v=`, and `none` for direct or organic visits (never a guess).
  - `hero_variant` records which first screen was actually shown.
  - Tracking is cookieless, so nothing survives a page load. The redirect to the guide therefore carries `v` and `utm_*` in its URL, which keeps `guide_viewed` attributed (`public/js/context.js`, unit-tested).

**Where to see it:** PostHog EU → Product analytics → saved insight **"Lead funnel"** (public link, no login: https://eu.posthog.com/shared/6Z291U1-E8eKKc3bfXXDRZHNOa6jiw).
To rebuild the insight:
1. New insight → Funnels.
2. Steps: `page_view` → `finder_used` → `result_shown` → `form_viewed` → `form_started` → `form_submitted`.
3. Breakdown by event property `ad_version`.
4. Conversion window: 1 hour.

**End-to-end test on the live site (12 Oct 2026)**, done with `?v=b&utm_source=test` and `clientelo-test@example.com`:
- **Client-side checks:** submit without consent was blocked on the page: error shown, focus moved to the checkbox, no request sent.
- **Valid submit:** `POST /api/lead` returned `200 {"ok":true}`, with payload `etf: qqq`, `ad_version: b`, `utm_source: test`. The page then redirected to `/pruvodce?etf=qqq`, showing the EQQQ ISIN.
- **`form_submitted` is not lost on redirect:** it was captured, and PostHog sent its queue by `sendBeacon` on `pagehide`, 549 ms later, during the redirect. This was recorded with a PerformanceObserver and a sendBeacon hook.
- **Server-side negatives** (curl against the live API):
  - `GET` → 405
  - bad email → 400
  - `consent:false` → 400
  - `consent:"true"` (a string, not a boolean) → 400
  - honeypot filled → fake 200, nothing stored
- **Checked by the owner in the Sheet:** exactly one row (`clientelo-test@example.com`, consent TRUE, `qqq`, `b`, `test`), and no honeypot row.
- **Checked by the owner in PostHog:** all seven funnel events arrived in order with `ad_version=b` and `utm_source=test`.
- **Bug found by the owner:** `guide_viewed` on `/pruvodce` arrived as `ad_version=a` with no UTM. Fixed as described under "Ad version" above.
  - **Fix verified on the live site** with `/api/lead` stubbed in the page, so no Sheet row was created: `guide_viewed` arrived with `ad_version=b`, `hero_variant=b`, `utm_source=test`, `utm_content=b_fees_stub`.
- **Test traffic in PostHog:**
  - The stubbed runs sent two fake `form_submitted` events, one live (`utm_content=b_fees_stub`) and one from localhost (`$host=localhost`).
  - All test traffic has `utm_source=test` or `$host=localhost`. Exclude both in the funnel before reading real numbers.

**Speed** (Lighthouse 12.8.2, mobile emulation, simulated slow 4G, live site, 12 Oct 2026):

| | Performance | FCP | LCP | TBT | CLS | A11y / BP / SEO |
|---|---|---|---|---|---|---|
| `?v=a`, first deploy (Google Fonts) | 87 | 3.0 s | 3.0 s | 20 ms | 0 | 100 / 96 / 100 |
| `?v=a`, self-hosted font + favicon | **98** | 1.0 s | **1.6 s** | 92 ms | 0 | 100 / 100 / 100 |
| `?v=b`, self-hosted font + favicon | **99** | 0.86 s | **1.45 s** | 59 ms | 0 | 100 / 100 / 100 |

**Leads:** the Google Sheet owned by the page owner. One row per lead: time, email, consent and consent-text version, picked ETF, ad version, UTM parameters.

## Expected conversion

**Landing visitor → lead: 4–9 %, base case about 6 %.**

| Benchmark | Value | Source |
|---|---|---|
| Finance & insurance landing pages, median | 8.3 % | [Unbounce Conversion Benchmark Report 2024, finance](https://unbounce.com/conversion-benchmark-report/finance-insurance-conversion-rate/) |
| … investing subcategory, median | 3.9 % | same |
| … traffic from paid social, median | 9.3 % | same |
| Meta lead campaigns, all industries, conversion rate | 8.54 % (CTR 2.70 %) | [LocalIQ Facebook Advertising Benchmarks 2026](https://localiq.com/blog/facebook-advertising-benchmarks/) |

**Why the range sits where it does:**
- **Pulls down:** investing is the weakest finance subcategory (3.9 %). The traffic is cold, from a scrolling feed. And the visitor gets the main answer free, so some leave satisfied without converting. That is the price of "value before the form".
- **Pulls up:**
  - one field;
  - a concrete, personalised next step as the offer;
  - the ask is shown at peak intent;
  - the ad's promise is repeated exactly, so there is no "wrong page" bounce;
  - the copy is short and plain, in line with Unbounce's finding that simpler reading levels convert best.

**Assumed funnel per 100 visitors** (to be replaced by real numbers after the first 1 000 visits):

| Stage | Visitors |
|---|---|
| `page_view` | 100 |
| `finder_used` | 55 |
| `result_shown` | 55 |
| `form_viewed` | 40 |
| `form_started` | 10 |
| `form_submitted` | 6 |

**Biggest uncertainty:** the tap rate on the chips (55 %). If it is low, hypothesis 3 below becomes the first test.

## A/B test hypotheses, ranked by expected impact

1. **Ad angle and matching hero (A "your broker blocked VOO" vs B "312 200 Kč in fees").** Already built (`?v=a`/`?v=b`, separate UTM links).
   - B reaches everyone with a bank fund; A only people who know tickers.
   - Expected: B gets a lower CTR but more leads per 1 000 impressions. Cost per lead could differ by 30 % or more.
   - Primary metric: cost per `form_submitted`, by `ad_version`.
2. **Offer: the generic 5-step guide vs "Your personal plan".**
   - The "personal plan" would be a one-page PDF with the visitor's twin, their own calculation (amount, years), and a fee checklist for 3–4 brokers.
   - A more personal and more tangible lead magnet should raise the submit rate among people who saw the form, by about 15–30 %.
   - Metric: `form_submitted / form_viewed`.
3. **A result shown by default vs tap-to-reveal.**
   - Show VOO → VUAA plus the calculator immediately for everyone (variant B already shows the numbers in the hero), instead of waiting for a chip tap.
   - Visitors who would never tap still see the value and reach the form. Expected: +10–20 % `form_viewed`, smaller effect on leads.
   - Metric: `form_submitted / page_view`.

Smaller ideas for later: CTA wording, merging the consent text into the button area, social proof once real numbers exist.

## How I worked with AI

**Setup:**
- One orchestrating session (Claude Code, Opus 5.5) planned the work, wrote most of the code, and checked everything that went into the repo.
- Subagents were used for research and data collection, in parallel where the tasks were independent.
- I set the rules up front:
  - plan first, max 40 lines, wait for "ok";
  - small commits;
  - real sourced data only;
  - list exactly which events to measure;
  - no global installs without asking.

**What the agents were told.** Each subagent got a narrow brief with a required output format:

| Agent | Brief (abridged) |
|---|---|
| PRIIPs claim | "Verify the claim … fetch each page yourself, do not rely on search snippets … return URL, publisher, an exact quote under 25 words, and whether you actually loaded the page. Note any nuance that would make the claim wrong." |
| Free plans | "Only report what the vendor's own page says now … mark anything you could not verify as UNVERIFIED." Focus on: funnels on the free plan, EU hosting, and whether any backend can email the visitor for free. |
| ETF data | Exact JSON schema with `{value, as_of, source_url, source_name, verified}` per field. "NEVER invent or estimate a value … issuer page first, justETF only as a cross-check, no automated scraping of justETF." |
| Bank fund KID | "From the issuer's own KID PDF … quote the exact Czech lines for ongoing and entry costs. Never estimate; if a figure is not in the KID, say NOT FOUND." |

**How the output was checked:**
- **Every claim used on the page was re-opened by the orchestrator, not by the agent that found it:**
  - EUR-Lex, LYNX, Saxo, the ČNB Q&A and Fio;
  - Vercel's Hobby terms, Resend and Formspree;
  - VUAA on Vanguard; SPYL, SPY5 and VWCE on justETF;
  - the bank fund's KID, re-downloaded from KBC and re-extracted with my own script.
- **Code:** written test-first where it computes or validates anything, with 22 tests. Copy that repeats numbers is tested against the calculator.
- **UI:** checked in a real browser at 390 px and 1440 px, with the funnel events read from `window.__events`.
- **The owner reviewed:** the plan, every decision in `DECISIONS.md`, and status reports. The owner caught one wrong number.

**Where the AI was wrong.** The full log is in [`NOTES-ai.md`](NOTES-ai.md). Short version:
- **The initial premise was too strong.** "EU retail can't buy VOO" is false for Czech execution-only brokers (Fio). Research caught it, and the copy changed.
- **A fetch tool paraphrased the tax law backwards.** It said the 3-year exemption does not apply. The page uses the law's own wording.
- **Agents made data slips:**
  - a wrong ISIN for FUSD, self-corrected;
  - Vanguard UK URLs ignore the slug, so a wrong product ID silently showed another fund;
  - one agent wrote a justETF scraper that the site's terms forbid. It was not used.
- **I (the orchestrator) slipped too:**
  - I wrote an unsourced sentence into the explainer and removed it;
  - my first "red" test failed for the wrong reason (a Windows path bug);
  - I reported "17 commits" when there were 13. The owner caught it.
- **Parallel agents shared one browser pane** and clicked in each other's tabs. Lesson: give each agent its own browser.

## What is missing and why

- **No email to the lead.** Free form backends don't autorespond, Resend needs a verified domain, and sending from a personal Gmail was rejected (D4). The guide is delivered on the page instead.
- **No Meta Pixel or Conversions API.** Without it, Meta cannot optimise campaigns for leads; it can only optimise for link clicks or landing-page views.
  - Adding a pixel would need a consent banner, which conflicts with D5.
  - Production fix: send a server-side Conversions API event from `api/lead.js` for consented leads. This is the first thing to add before spending real budget.
- **No double opt-in.** It is needed before sending marketing email.
- **Data is a snapshot from 12 Oct 2026.** No automatic refresh. TER changes rarely; fund size changes daily, which is why it carries a date.
- **The bank fund comparison uses the maximum entry fee (3 %)** stated in the KID. Real distributors may charge less, and the page says "až 3 %".
- **Broker fees and CZK→EUR conversion are not in the calculator.** They depend on the broker; the page says so under the calculator.
- **Vercel Hobby forbids commercial use** (D6). A real campaign needs Pro or another host.
- **Meta ad policy for financial services in Czechia** (advertiser verification, special ad category) was not verified. Check it in Ads Manager before launch.

## Run locally

```bash
npm test
npm run dev
```
`npm run dev` builds the data and serves `public/` on :3000. `/api/lead` only runs on Vercel; set `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET` there.
