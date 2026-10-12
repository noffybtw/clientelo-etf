# Decisions

Where the task was unclear or research changed an assumption, the decision and the reason are logged here.

## D1. "Can't buy VOO" is worded as "most brokers", not "you can't"
- **Decision:** the page says most EU brokers block retail buy orders for US-domiciled ETFs (no PRIIPs KID). It names Fio banka as a Czech exception and recommends the UCITS twin as the simpler route.
- **Why:** PRIIPs Art. 13(1) puts the KID duty on whoever sells or advises. LYNX, Saxo and Interactive Brokers block retail buys of US ETFs. But the ČNB Q&A (RS2018-12, part B, Q2) says an execution-only broker is not subject to Art. 13(1), and Fio states "U nás můžete obchodovat i s americkými ETF". An absolute claim would be false and would cost trust with exactly the reader who knows Fio.
- **Sources:** see the explainer section on the page and `data/sources.md`.

## D2. QQQ is included although it lists on Nasdaq, not NYSE
- **Decision:** QQQ is included with a footnote. The other US funds (VOO, IVV, SPY, VT, SCHD) list on NYSE Arca.
- **Why:** the task says NYSE ETFs, but QQQ is one of the three tickers the audience actually types. Leaving it out would break the finder for a large share of visitors.

## D3. Near-twins and "no twin" are labelled, not hidden
- **VT → VWCE:** FTSE Global All Cap vs FTSE All-World (no small caps). Labelled "podobný index".
- **SCHD:** no UCITS fund tracks its index, so the page says so and shows a proxy, marked as a proxy.
- **Not included:** VTI, VEA and VXUS, because they have no honest twin.

## D4. No email is sent to the lead; the guide is delivered on the page
- **Decision:** after submit, the visitor immediately sees the guide (`/pruvodce`) on the site. The lead is appended to a Google Sheet by an Apps Script web app that has **no mail permission**.
- **Why:** no free hosted form backend (Formspree, Web3Forms, Basin, Forminit) sends autoresponders on its free plan. Resend needs a verified domain to email anyone but the account owner. Sending from the owner's personal Gmail was rejected: a public form must not be able to send mail from a personal inbox.
- **Production:** send the guide from a verified domain (e.g. Resend), ideally as double opt-in.

## D5. Analytics without cookies and without a consent banner
- **Decision:** PostHog Cloud EU (Frankfurt) with `persistence: 'memory'`, so nothing is stored in cookies or localStorage. "Discard client IP data" is switched on in project settings.
- **Why:** the whole funnel (arrival → submit) happens in one page visit, so cross-visit identity is not needed. A consent banner on a 3-second mobile visit costs conversions. The price is that returning visitors are not recognised.

## D6. Hosting on Vercel Hobby is acceptable only for this demo
- **Decision:** the demo is hosted on Vercel Hobby.
- **Why:** Vercel's docs say Hobby is "non-commercial, personal use only". This demo is a job-application piece. A real paid campaign must move to Vercel Pro or another host whose terms allow commercial use.

## D7. Fee calculator compares against a real Czech bank fund
- **Decision:** 0.03 % vs 0.07 % between twins is too small to carry an ad, so the calculator compares the twin's TER with a real Czech bank fund's KID costs (ongoing costs + entry fee).
- **Rule:** if no fund can be sourced from its KID, the comparison is dropped after asking.
- **Chosen fund (2026-10-12):** ČSOB Akciový Amerika (KBC Equity Fund North America, Classic Shares CSOB CZK, ISIN BE6252265333).
  - **KID** dated 13 Feb 2026: ongoing costs 1.66 % p.a. and entry costs max 3.00 %; no exit fee, no performance fee.
  - **Why this fund:** sold in CZK by a top-3 bank, US/Canada equities, unhedged, and the KID is recent.
  - **Cost treatment:** the calculator uses ongoing costs vs TER. Transaction costs are excluded on both sides. The entry fee is used at its maximum, and the page says "až 3 %".
  - **Other funds checked:** six more CZK bank funds (Erste, ČSOB, Amundi/KB). They are listed in `data/bank_fund.json` → `why_this_fund`.

## D8. Static site, no framework
- **Decision:** plain HTML/CSS/JS plus one Vercel function.
- **Why:** the visitor is on a phone, from an ad, for seconds; LCP matters more than developer convenience. The page has one interactive widget, which does not justify a framework.
