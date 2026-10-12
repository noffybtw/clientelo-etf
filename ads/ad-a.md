# Ad A: "Your broker blocked VOO" (problem / curiosity)

**Placement:** Meta mobile feed (Facebook + Instagram), 4:5 image 1080×1350.
**Who it is for:** people who already know a ticker from YouTube or friends and may have hit the block in their app.
**Landing variant:** `?v=a`. The hero repeats the promise word for word: *"VOO, SPY ani QQQ u většiny brokerů nekoupíte. Jejich evropské dvojče ano."*

## Copy (Czech)

| Field | Text | Length |
|---|---|---|
| Hook (first line of primary text) | Chtěli jste koupit VOO a aplikace napsala „nelze“? | 50 |
| Primary text | Chtěli jste koupit VOO a aplikace napsala „nelze“?<br><br>Americká ETF nemají dokument KID, který EU vyžaduje, a většina brokerů je proto drobným investorům neprodá. Každé z nich má ale evropské „dvojče“ se stejným indexem, které koupíte normálně.<br><br>Vyberte VOO, SPY, QQQ nebo jiný fond, který znáte, a hned uvidíte to své. Zdarma, bez registrace. | ~370 |
| Headline | Najděte evropské dvojče VOO | 27 |
| Description | Srovnání 6 populárních ETF se zdroji | 36 |
| CTA button | Další informace (Learn more) | |

The first ~125 characters (what shows before "…více") carry the hook and the reason on their own.

## Image

[`ad-a.png`](ad-a.png), source: [`ad-a.html`](ad-a.html)

**Concept:** a bank-statement card, the same visual system as the page.
- "VOO" is struck through, with a green "VUAA" next to it.
- Three rows: "Index: S&P 500 = S&P 500", "Koupíte z Česka: ne / ano", "Poplatek: 0,03 % / 0,07 %".
- Showing that the twin is a bit more expensive is deliberate. It is honest, and it pre-empts the comment "but VUAA costs more".

## Link

```
https://LIVE_URL/?v=a&utm_source=facebook&utm_medium=paid_social&utm_campaign=etf_dvojcata_2026_10&utm_content=a_voo_blocked
```
On Instagram placements, `utm_source={{site_source_name}}` (Meta dynamic parameter) separates fb and ig.

## Why it should work
- The ad names the exact moment of frustration this audience has had: a tap on Buy, then an error.
- It promises a concrete fix (one ticker), not "learn about investing".
- The page delivers that fix in one tap, before any form.

## Before launch
- Financial-services ads on Meta can need advertiser verification and can fall under a special ad category depending on country. Check the current Meta ad policy for Czechia in Ads Manager. This was not verified here.
- ČNB rules on marketing communication for investment services: the ad does not recommend a product or promise returns; the landing page carries the disclaimer.
