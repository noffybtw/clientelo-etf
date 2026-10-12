# AI log

| File | Contents |
|---|---|
| `01-setup-and-build.md` | Main session from Step 0 to the first milestone: research, plan, build, ads, README. |
| `01-subagents.md` | The brief and the final report of each of the 5 subagents. |
| `02-deploy-and-live-test.md` | From the first export to the live site: accounts, push, Vercel, live form test, Lighthouse and the font fix. Only messages after export 01 are included (`--after`). |
| `03-attribution-fix-and-wrap-up.md` | The owner's checks of the Sheet and PostHog, the `guide_viewed` attribution bug and its fix, the live re-check, wrap-up. Only messages after export 02 are included. |
| `04-final-cleanup.md` | Pre-submission cleanup: `.claude/` out of the repo, source labels per fund in the comparison cards, live check, and the cache-busting mistake in the deploy checks. Only messages after export 03 are included. |

**How it was made.** This session ran in the Claude desktop app (Code tab). There, `/export` is not a command; it arrives as a chat message. The Claude Code CLI is installed on this machine, but this session was run in the desktop app, so its transcript was exported with the app's own Export.
1. The transcript was exported with the app's own **Export** (a zip of JSONL files).
2. The zip was converted to Markdown by [`scripts/export-transcript.mjs`](../scripts/export-transcript.mjs).

**What the conversion keeps and drops:**
- **Kept:** every user message, every assistant reply, and every tool call with its input.
- **Truncated** to 400 characters: tool outputs, so no fetched web page or KID PDF is republished.
- **Dropped:** hidden reasoning, internal metadata and file snapshots.
- **Redacted:** the Apps Script deployment ID. It is not a secret (requests need the shared secret), but there is no reason to publish it. The PostHog key stays, because it is a public client key and is in the code anyway.
