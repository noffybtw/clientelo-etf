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
