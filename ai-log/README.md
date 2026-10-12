# AI log

| File | Contents |
|---|---|
| `01-setup-and-build.md` | Main session from Step 0 to the first milestone: research, plan, build, ads, README. |
| `01-subagents.md` | The brief and the final report of each of the 5 subagents. |

**How it was made.** This session ran in the Claude desktop app (Code tab). There, `/export` is not a command; it arrives as a chat message. The CLI is not installed on this machine.
1. The transcript was exported with the app's own **Export** (a zip of JSONL files).
2. The zip was converted to Markdown by [`scripts/export-transcript.mjs`](../scripts/export-transcript.mjs).

**What the conversion keeps and drops:**
- **Kept:** every user message, every assistant reply, and every tool call with its input.
- **Truncated** to 400 characters: tool outputs, so no fetched web page or KID PDF is republished.
- **Dropped:** hidden reasoning, internal metadata and file snapshots.
