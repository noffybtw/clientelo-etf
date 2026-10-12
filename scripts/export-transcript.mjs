// Converts the Claude desktop app's session export (unzipped folder with
// transcript.jsonl + <session>/subagents/*.jsonl) into readable Markdown.
// Used because the CLI's /export is not available in the desktop Code tab.
// Tool outputs are truncated so no fetched web page or PDF is republished.
//
//   node scripts/export-transcript.mjs <unzipped-export-dir> <out.md> [<subagents-out.md>] [--after <ISO time>]
// --after keeps only records newer than the given time, so a later export
// does not repeat what an earlier one already contains.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const ai = argv.indexOf('--after');
const after = ai >= 0 ? argv.splice(ai, 2)[1] : null;
const [dir, out, outSub] = argv;
const isNew = (o) => !after || (o.timestamp && o.timestamp > after);
if (!dir || !out) { console.error('usage: export-transcript.mjs <dir> <out.md> [subagents.md]'); process.exit(1); }

const RESULT_MAX = 400;
const INPUT_MAX = 700;
const cut = (s, n) => (s.length > n ? s.slice(0, n) + ` … [${s.length - n} more chars]` : s);
const fence = (s) => '```\n' + s.replace(/```/g, "'''") + '\n```';

// Not secrets, but no reason to publish: the Apps Script deployment ID.
const redact = (s) => s.replace(/(script\.google\.com\/macros\/s\/)[A-Za-z0-9_-]{20,}/g, '$1[redacted]')
  .replace(/AKfycb[A-Za-z0-9_-]{20,}/g, '[redacted-apps-script-id]');

function readJsonl(p) {
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((b) => (b.type === 'text' ? b.text : b.type === 'image' ? '[image]' : '')).join('\n');
}

function inputOf(name, input) {
  const i = { ...input };
  for (const k of ['content', 'new_string', 'old_string', 'widget_code', 'script']) {
    if (typeof i[k] === 'string') i[k] = cut(i[k], 300);
  }
  return cut(JSON.stringify(i, null, 1), INPUT_MAX);
}

function render(records, { title }) {
  const lines = [`# ${title}`, ''];
  for (const o of records) {
    const m = o.message;
    if (!m || o.isMeta || !isNew(o)) continue;
    const ts = o.timestamp ? o.timestamp.replace('T', ' ').slice(0, 16) : '';
    if (o.type === 'user') {
      if (typeof m.content === 'string' || (Array.isArray(m.content) && m.content.some((b) => b.type === 'text'))) {
        const t = textOf(m.content).trim();
        if (!t || t.startsWith('<system-reminder>') || t.startsWith('[SYSTEM NOTIFICATION')) continue;
        lines.push(`## User · ${ts}`, '', t, '');
      }
      for (const b of Array.isArray(m.content) ? m.content : []) {
        if (b.type !== 'tool_result') continue;
        const r = typeof b.content === 'string' ? b.content : textOf(b.content);
        lines.push(`<details><summary>result${b.is_error ? ' (error)' : ''}</summary>`, '', fence(cut(r.trim(), RESULT_MAX)), '', '</details>', '');
      }
    } else if (o.type === 'assistant') {
      for (const b of m.content || []) {
        if (b.type === 'text' && b.text.trim()) lines.push(`## Claude · ${ts}`, '', b.text.trim(), '');
        if (b.type === 'tool_use') lines.push(`**→ ${b.name}**`, '', fence(inputOf(b.name, b.input || {})), '');
      }
    }
  }
  return lines.join('\n');
}

const main = readJsonl(join(dir, 'transcript.jsonl'));
const title = main.find((o) => o.type === 'custom-title')?.customTitle || 'Session';
writeFileSync(out, redact(render(main, { title: `Claude Code session: ${title}` })));
console.log(`wrote ${out}`);

if (outSub) {
  const session = readdirSync(dir).find((d) => existsSync(join(dir, d, 'subagents')));
  const subDir = join(dir, session, 'subagents');
  const parts = ['# Subagent transcripts (briefs and final reports)', '',
    'Each subagent: the brief it received and its final report. Intermediate tool calls are listed with truncated outputs.', ''];
  for (const f of readdirSync(subDir).filter((f) => f.endsWith('.jsonl')).sort()) {
    const recs = readJsonl(join(subDir, f));
    if (!recs.some(isNew)) continue;
    let desc = f;
    try { desc = JSON.parse(readFileSync(join(subDir, f.replace('.jsonl', '.meta.json')), 'utf8')).description || f; } catch {}
    parts.push(render(recs, { title: `Subagent: ${desc}` }).replace(/^# /, '## ').replace(/\n## /g, '\n### '), '');
  }
  writeFileSync(outSub, parts.join('\n'));
  console.log(`wrote ${outSub}`);
}
