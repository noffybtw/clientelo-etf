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
