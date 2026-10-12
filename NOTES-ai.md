# Notes on working with AI

A running log, newest at the bottom. What the agents were asked, how their output was checked, and where they were wrong.

## 2026-10-12: Step 0 and Step 1 (research)
- **Setup:** Claude Code (Opus) as the orchestrator. Three research subagents ran in parallel, each with a narrow brief that required a URL, a short exact quote, and "did you actually load the page" for every claim.
  1. PRIIPs / KID claim
  2. Free plans: analytics and form backends
  3. ETF pairs and data availability
- **Checking:** the orchestrator re-opened the key pages itself before using any claim:
  - Vercel Hobby terms
  - Resend domain rule
  - Formspree plans
  - Fio ETF page
  - ČNB Q&A
  - LYNX KID page
  - SPYL on justETF
- **Where the starting assumption was wrong:** "EU retail investors cannot buy VOO" is too strong for Czechia. Fio allows it (execution-only, ČNB Q&A), so the wording was changed (DECISIONS D1).
- **Where an agent was wrong or unsure:**
  - The ETF agent first used a wrong ISIN for FUSD (Fidelity *Global* Quality Income) and caught it itself.
  - It also found that Vanguard UK/DE URLs ignore the slug: product ID 9679 returned VWCE under an "S&P 500" URL.
  - It wrote a justETF scraper script. That conflicts with justETF's terms (no automated price queries), so the script is not used.
- **What could not be verified:**
  - No official XTB, DEGIRO or Trading 212 help page about the KID block was found, so the page does not name them.
  - The exact PostHog EU host is not stated in the docs the agent read; it will be taken from the project settings.
- **Human decisions that overrode the AI plan:**
  - Do not send mail from the personal Gmail.
  - Turn on IP discarding.
  - Find a real Czech bank fund for the fee comparison instead of comparing 0.03 % vs 0.07 %.

## 2026-10-12: Step 2 (build)
- Calculator written test-first (node:test).
  - My first "red" run failed for the wrong reason: a runner path bug on Windows, not the missing module. I noticed this, fixed the script, and re-ran red/green properly.
- Explainer copy: I (the orchestrator) wrote a sentence with no source ("you don't have to deal with US forms") and removed it on self-review. Every remaining claim in the explainer links to a page that was opened in this session (EUR-Lex, LYNX, Saxo, ČNB, Fio).
- **Bank fund research (subagent):** opened 7 KID PDFs. The orchestrator re-downloaded the chosen KID straight from KBC's server and extracted the text with its own pypdf script, without reusing the agent's extraction. The cost lines matched: 1,66 %, Max. 3,00 %, no exit fee, no performance fee.
  - The agent reported a possible stray click in a browser tab another agent had opened (shared browser pane). Lesson: parallel agents should not share one browser.
- **Tax rules in the guide:**
  - Web search gave conflicting paragraph letters for the time test (w vs u).
  - The law text on zakonyprolidi.cz, in the version valid from 1. 8. 2026, says písm. t) for the 100 000 Kč limit and písm. u) for the 3-year test.
  - The fetch tool's paraphrase of písm. u) was wrong: it said the exemption does NOT apply after 3 years. The page uses the law's wording, not the tool's paraphrase.
- **Wrong number in a status report:** I told the owner "17 commits" when `git log` showed 13. I had estimated instead of counting, and the owner caught it.
  - Lesson: every number in a status message (commits, tests, prices) is taken from command output in the same turn, never from memory.
- **Export:** the owner typed `/export ai-log/01-setup-and-build.md`. In the desktop Code tab that arrives as a chat message and does nothing, and I checked: `ai-log/` was still empty.
  - I used the app's Export tool instead and converted its JSONL to Markdown with a script in the repo.
  - Before committing, I scanned the output for secrets: none found.
- **Wrong claim about the Apps Script scope:** my comment in `backend/apps-script.gs` said the OAuth scope was "limited to this spreadsheet". It was not. `SpreadsheetApp` asks for access to all of the owner's spreadsheets unless the script has the `/** @OnlyCurrentDoc */` annotation.
  - The owner caught it in Google's consent screen and added the annotation; the repo file now has it too.
  - Lesson: a security claim in a comment needs the same verification as a number on the page.

## 2026-10-12: Deploy and live verification
- **Live end-to-end test:** the orchestrator submitted the real form at `?v=b&utm_source=test`.
  - It hooked `sendBeacon` and a PerformanceObserver to prove that `form_submitted` leaves the page before the redirect: a beacon fires on `pagehide`, 549 ms after the event.
  - First attempt at the hook missed PostHog's requests: posthog-js keeps its own reference to `fetch`, so wrapping `window.fetch` saw nothing. Resource timing showed the requests instead.
- **Lighthouse on the first deploy** scored 87, with LCP 3.0 s. My original plan (Google Fonts with `display=swap` plus preconnect) was still render-blocking, about 800 ms through the third-party CSS chain.
  - Self-hosting the two woff2 subsets fixed it: 98–99, LCP about 1.5 s.
  - Lesson: "preconnect + swap" is not enough on a 3-second mobile visit; measure it.
- **Vercel deploys** took about 4 minutes after a push. Vercel does not post deployment statuses to GitHub here, so "is it live" was checked by fetching a file that changed in the commit.
- **Attribution bug, found by the owner in PostHog:** `guide_viewed` on `/pruvodce` arrived with `ad_version=a` and no UTM.
  - Two mistakes of mine combined. First, with `persistence: 'memory'` the super-properties die on the redirect, and I only verified the funnel up to `form_submitted`, never the next page. Second, `track.js` defaulted any missing `?v=` to `"a"`, so the bug looked like valid data instead of a gap.
  - Fix: a pure `context.js`, unit-tested first (red for the right reason, then green, 27/27).
    - `ad_version` is `none` when unknown.
    - A separate `hero_variant` records the first screen shown.
    - The guide URL carries `v` and `utm_*` (not `fbclid`).
  - Verified in the browser with `/api/lead` stubbed in the page, so no extra Sheet row: `guide_viewed` came out with `ad_version=b`, `utm_source=test`, `utm_content=b_fees`.
  - Lesson: a default that silently fills in a measurement is worse than an explicit "unknown".
  - **Live re-check** after deploy `0e18491`: the guide event is correctly attributed.
    - My "not live after 6 min" was only a delay; the owner saw the deploy queued, and it went live shortly after.
    - The stubbed submit still sent a fake `form_submitted` to PostHog, since only the Sheet was skipped. It is marked `utm_content=b_fees_stub`, and the README says to filter test traffic.
- **Wrong deploy check (twice):** I polled the live site with `?r=<random>` to bypass the cache. Vercel's CDN ignores the query string for static files: the same `etag` and `age` came back with and without it. So I was reading a cached copy, and twice reported "not live" while the deploy was ready or nearly ready.
  - Fix: compare the `etag` and the file content, not the URL. With that, the label fix was confirmed live (`age: 0`, new `etag`).

## 2026-10-12: Owner's design review
- **The verdict:** the page "still looks like a default AI build and the first mobile screen doesn't sell". The owner gave nine ordered changes with hard constraints: no change to data, copy meaning, consent, form, A/B logic or event names; Lighthouse ≥ 95; WCAG AA. All nine were implemented (commits `c322645` to `0d7efb7`).
- **Where I deviated, and why:**
  - **Email field border:** `#7a838f` instead of `#d5dbe2`. The latter is 1.39:1, which fails WCAG 1.4.11 when the border is the field's only cue. Chips keep `#d5dbe2`, because their label and solid selected state carry the meaning.
  - **Variant B hero order:** the bars sit directly under the h1 (point 3), so the 13 px line moves below the caption. In variant A it sits directly under the h1 (point 2).
  - **Favicon:** recoloured to ink/white ("nothing else coloured").
  - **Smooth scroll to the result:** made instant (no motion beyond colour transitions).
- **My own slips during the review:**
  - I added a new Czech sentence to the footer ("Zdroj je uveden u každého čísla") and removed it again: the constraint was "do not change the copy".
  - A shell loop wrote all six screenshots to the same file because of bad quoting; I caught it and re-ran it.
  - Headless Chrome at 390 px lays out wider than 390 (it has a minimum window width), which made the guide look cut off. A real 390 px viewport showed no overflow (widest element ends at 374 px). For 390 px I used the emulated pane; for 1440 px, headless Chrome.
- **Regressions the redesign caused, caught by measuring rather than eyeballing:**
  - The first Lighthouse run after the redesign scored 93 on `?v=a`, below the owner's 95, with CLS 0.158. The shorter hero had pulled `#why` into the first screen, where it moved when JS filled the comparison list.
  - Then CLS 0.065 on `?v=b` (the h1 switched to the B text only when `app.js` ran) and 0.126 on `/pruvodce` (the fund box filled late).
  - Fixed by reserving the list's space, swapping the B texts in an inline script before first paint, and reserving the guide's box. Result: 100 / 100 / 100, with CLS 0 everywhere.
- **Funnel check without touching production:**
  - Local test runs had previously sent fake events to the real PostHog project, so `track.js` now never loads PostHog on localhost.
  - `/api/lead` was intercepted in the page, so no Sheet row was created.
  - Result: all 8 funnel events and `guide_viewed` fired with unchanged names and properties (`ad_version=b`, UTM intact through the redirect), with 0 requests to PostHog.
- **Deploy check:** confirmed by SHA-256 of 7 deployed files against the local build, plus fresh etags (`age: 2`). No query-string cache-buster, per the lesson above.
- **Corrected sentence in `ai-log/README.md`:** it claimed the Claude Code CLI was not installed. My Step 0 check only looked for `claude` on this shell's PATH; the owner confirmed it is installed and the session was simply run in the desktop app.
- **Two leftovers flagged by me after the review, fixed on the owner's request:**
  - **Ads:** the creatives still used the old serif and green. They were rebuilt in the new look with the same copy and numbers, rendered again at 1080×1350 with headless Chrome, and checked visually. While updating `ad-b.md` I also corrected its bar label to match the creative ("Bankovní akciový fond").
  - **TER format:** the EQQQ result card showed "0,3 %" next to a note saying "0,30 %". `String(0.3)` drops the trailing zero.
    - A tested `terPct()` now always shows at least two decimals and keeps extra precision (SPY 0,0945 %).
    - Tests were written first; one of them runs every TER in the dataset.
    - Only TER uses it; the bank fund's "1,66 %" and "až 3 %" are unchanged.
