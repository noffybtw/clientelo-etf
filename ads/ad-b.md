# Ad B: "312 200 Kč in fees" (money / loss aversion)

**Placement:** Meta mobile feed (Facebook + Instagram), 4:5 image 1080×1350.
**Who it is for:** people saving through a bank fund, or about to start, who have never added up the fees in korunas.
**Landing variant:** `?v=b`.
- Hero headline: *"Kolik vám z investice za 20 let sní poplatky?"*
- First line under it: the same two numbers as the ad.

## The numbers and where they come from
- **Inputs:** 3 000 Kč a month for 20 years, 7 % a year before costs (an assumption, stated in the ad).
- **ETF side:** VUAA, TER 0.07 % (Vanguard UK product page, 12 Oct 2026). Fees: **12 900 Kč**.
- **Bank side:** ČSOB Akciový Amerika, ongoing costs 1.66 % plus a max 3 % entry fee (KID of 13 Feb 2026). Fees: **312 200 Kč**.
- **Calculation:** `public/js/calc.js`. Fees = what the fund loses against the same money with zero costs.
- **Guard:** `test/copy.test.js` fails if the data change and this copy does not.
- **Naming:** the ad says "bankovní akciový fond" without naming the bank. The landing page names the fund and links its KID. Naming a competitor in the ad itself is a legal and brand-safety risk, and it adds nothing.

## Copy (Czech)

| Field | Text | Length |
|---|---|---|
| Hook | 312 200 Kč. Tolik vás za 20 let může stát bankovní fond na poplatcích. | 70 |
| Primary text | 312 200 Kč. Tolik vás za 20 let může stát bankovní fond na poplatcích.<br><br>Při 3 000 Kč měsíčně zaplatíte v běžném bankovním akciovém fondu na poplatcích 312 200 Kč. V indexovém ETF na americké akcie 12 900 Kč. Peníze vložíte stejné, rozdíl zůstane vám.<br><br>Spočítejte si svou částku za 10 vteřin.<br><br>*Předpoklad: výnos 7 % ročně před poplatky, náklady podle KID fondu. Ilustrace, ne prognóza ani investiční doporučení.* | ~400 |
| Headline | Spočítejte si své poplatky | 26 |
| Description | Kalkulačka zdarma, výsledek hned | 32 |
| CTA button | Další informace (Learn more) | |

## Image

[`ad-b.png`](ad-b.png), source: [`ad-b.html`](ad-b.html)

**Concept:** two horizontal bars on a white background, in the page's visual system (system sans at 800, no serif). The layout mirrors the `?v=b` hero.
- A full-width bar in `#c2410c`, "Bankovní akciový fond 312 200 Kč". This orange is used only for the bank-fund figure and its bar.
- A to-scale ink (`#111418`) bar, 4.13 % of the width, "Indexové ETF 12 900 Kč".
- Label under the headline: "Poplatky za 20 let při 3 000 Kč měsíčně"; footnote with the assumption.
- The visual gap between the bars is the whole message.

## Link

```
https://clientelo-etf.vercel.app/?v=b&utm_source=facebook&utm_medium=paid_social&utm_campaign=etf_dvojcata_2026_10&utm_content=b_fees_312k
```

## Why it should work
- A korunas figure beats a percentage: "1.66 % vs 0.07 %" means nothing to a beginner, while 312 200 Kč does.
- It speaks to a larger audience than ad A: everyone with a bank fund, not only people who know tickers.

## Risk
- A big number can read as clickbait. Mitigations:
  - The assumption is stated in the ad.
  - The page shows the source KID and lets the visitor change the inputs.
  - The number is rounded only to hundreds, the same as the page.
