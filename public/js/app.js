import { compareCosts } from './calc.js';
import { track, adVersion, heroVariant } from './track.js';
import { guideUrl } from './context.js';

const $ = (s, el = document) => el.querySelector(s);
const val = (f) => (f && f.value != null ? f.value : null);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kc = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(n / 100) * 100) + ' Kč';
const pct = (n) => String(n).replace('.', ',') + ' %';
const dist = (f) => {
  const v = String(val(f) || '');
  if (v.startsWith('Accumulating')) return 'reinvestuje (akumulační)';
  if (v.startsWith('Distributing')) return v.includes('quarterly') ? 'vyplácí čtvrtletně' : 'vyplácí (distribuční)';
  return v || '–';
};
const idx = (f) => String(val(f) || '–').replace(/ Index$/, '');
// "USD 88.97 bn (fund total; ...)" -> "88,97 mld. USD (celý fond)"
const size = (f) => {
  const m = /USD ([\d.]+) bn/.exec(val(f) || '');
  if (!m) return '–';
  const d = f.as_of ? `, k ${fmtDate(f.as_of)}` : '';
  return `${m[1].replace('.', ',')} mld. USD (celý fond${d})`;
};

let data = null;
let current = null;
const calcState = { monthly: 3000, years: 20, returnPct: 7 };

// ---------- hero variant (?v=b) ----------
if (heroVariant === 'b') {
  for (const el of document.querySelectorAll('[data-v-b]')) el.innerHTML = el.dataset.vB;
  document.title = 'Kolik vám z investice sní poplatky? Srovnání ETF a bankovního fondu';
}

// ---------- funnel: page_view, scroll_50 ----------
track('page_view', { path: location.pathname }, { onlyOnce: true });
addEventListener('scroll', () => {
  const h = document.documentElement;
  if ((h.scrollTop + innerHeight) / h.scrollHeight >= 0.5) track('scroll_50', {}, { onlyOnce: true });
}, { passive: true });

// ---------- data ----------
const ready = fetch('/data/etfs.json').then((r) => r.json()).then((d) => { data = d; renderPairs(); return d; });

// ---------- finder ----------
$('#chips').addEventListener('change', async (e) => {
  const id = e.target.value;
  track('finder_used', { etf: id });
  await ready;
  showResult(id);
});

function sourcesOf(obj, sep = ', ') {
  const seen = new Map();
  for (const f of Object.values(obj || {})) {
    if (f && f.source_url && !seen.has(f.source_url)) seen.set(f.source_url, f.source_name);
  }
  return [...seen].map(([u, n]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(sep);
}

// "VOO: Vanguard, VUAA: Vanguard": each source labelled with its fund
const labelledSources = (funds) => funds.map(([ticker, obj]) => `${esc(ticker)}: ${sourcesOf(obj, ' + ')}`).join(', ');

function showResult(id) {
  const p = data.pairs.find((x) => x.id === id);
  if (!p) return;
  current = p;
  const t = p.twin || p.proxy;
  const isProxy = !p.twin;
  const badge = p.match === 'same_index' ? '<span class="badge">stejný index</span>'
    : p.match === 'near_index' ? '<span class="badge warn">podobný index</span>'
    : '<span class="badge warn">přesné dvojče neexistuje</span>';

  const el = $('#result');
  el.innerHTML = `
    <div class="swap"><span class="from">${esc(p.us.ticker)}</span><span class="arrow">→</span><span class="to">${esc(val(t.xetra_ticker) || t.ticker)}</span></div>
    <p class="twin-name">${esc(val(t.name))} ${badge}</p>
    ${isProxy ? `<p class="note">${esc(p.us.ticker)} sleduje ${esc(val(p.us.index))}. Evropský fond se stejným indexem neexistuje. Nejbližší dividendová alternativa je níže, ale je to jiný fond.</p>` : ''}
    <ul class="rows">
      <li><span>Index</span><span>${esc(idx(t.index))}</span></li>
      <li><span>Roční poplatek (TER)</span><span>${pct(val(t.ter_pct))}</span></li>
      <li><span>Výnosy</span><span>${esc(dist(t.distribution))}</span></li>
      <li><span>Kde koupit</span><span>Xetra, v ${esc(val(t.trading_currency_xetra) || 'EUR')}</span></li>
      <li><span>Velikost fondu</span><span>${esc(size(t.fund_size))}</span></li>
      <li><span>ISIN</span><span class="mono">${esc(val(t.isin))}</span></li>
    </ul>
    <p class="note">${esc(p.match_note_cs || '')}</p>
    <p class="src">Zdroj: ${sourcesOf(t)}, staženo ${esc(fmtDate(data.retrieved))}</p>
    ${calcMarkup()}
  `;
  el.hidden = false;
  track('result_shown', { etf: id, twin: t.ticker, is_proxy: isProxy });
  bindCalc(t);
  showLead(id);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
}

// ---------- calculator ----------
function calcMarkup() {
  const b = data.bank_fund;
  if (!b) return '';
  return `
    <div class="calc" id="calc">
      <h3>Kolik vás stojí poplatky</h3>
      <div class="calc-in">
        <div><label for="c-monthly">Investuji měsíčně <output id="o-monthly"></output></label>
          <input type="range" id="c-monthly" min="500" max="20000" step="500" value="${calcState.monthly}"></div>
        <div><label for="c-years">Po dobu <output id="o-years"></output></label>
          <input type="range" id="c-years" min="5" max="40" step="1" value="${calcState.years}"></div>
      </div>
      <div class="bars" id="c-bars"></div>
      <p class="verdict" id="c-verdict"></p>
      <p class="assume">Předpoklad: výnos
        <select id="c-return" aria-label="Předpokládaný roční výnos">
          ${[4, 7, 10].map((r) => `<option value="${r}" ${r === calcState.returnPct ? 'selected' : ''}>${r} %</option>`).join('')}
        </select>
        ročně před poplatky (ilustrace, ne prognóza). Bankovní fond: ${esc(b.short_name)} (ISIN ${esc(b.isin.value)}), americké akcie, průběžné náklady ${pct(b.ongoing_pct.value)} ročně a vstupní poplatek až ${pct(b.entry_pct.value)} podle <a href="${esc(b.ongoing_pct.source_url)}" target="_blank" rel="noopener">KID</a>. U ETF počítáme jen TER; poplatek brokera a směna korun na eura nejsou zahrnuté.</p>
    </div>`;
}

function bindCalc(t) {
  const m = $('#c-monthly'), y = $('#c-years'), r = $('#c-return');
  if (!m) return;
  let used = false;
  const update = (e) => {
    calcState.monthly = +m.value; calcState.years = +y.value; calcState.returnPct = +r.value;
    renderCalc(t);
    if (e && !used) { used = true; track('calculator_used', { ...calcState, etf: current.id }); }
  };
  for (const el of [m, y, r]) el.addEventListener('input', update);
  update();
}

function renderCalc(t) {
  const b = data.bank_fund;
  const c = compareCosts({
    ...calcState,
    a: { ongoingPct: val(t.ter_pct), entryPct: 0 },
    b: { ongoingPct: b.ongoing_pct.value, entryPct: b.entry_pct.value },
  });
  $('#o-monthly').textContent = kc(calcState.monthly);
  $('#o-years').textContent = `${calcState.years} let`;
  const max = Math.max(c.a.lostToCosts, c.b.lostToCosts);
  const row = (cls, label, v) => `
    <div class="bar-row ${cls}">
      <div class="lbl"><span>${label}</span><strong>${kc(v)}</strong></div>
      <div class="track"><div class="fill" style="width:${Math.max(1, (v / max) * 100)}%"></div></div>
    </div>`;
  $('#c-bars').innerHTML =
    row('etf', `Poplatky ${esc(val(t.xetra_ticker) || t.ticker)}`, c.a.lostToCosts) +
    row('bank', `Poplatky ${esc(b.short_name)}`, c.b.lostToCosts);
  $('#c-verdict').innerHTML = `Z vložených ${kc(c.paidIn)} vám ETF nechá o <b>${kc(c.difference)}</b> víc.`;
}

// ---------- lead form ----------
let viewObserver = null;
function showLead(id) {
  $('#lead-etf').value = id;
  const box = $('#lead');
  if (!box.hidden) return;
  box.hidden = false;
  viewObserver = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { track('form_viewed', { etf: $('#lead-etf').value }, { onlyOnce: true }); viewObserver.disconnect(); }
  }, { threshold: 0.5 });
  viewObserver.observe(box);
}

$('#cta-end').addEventListener('click', () => showLead($('#lead-etf').value || 'none'));

const form = $('#lead-form');
form.addEventListener('focusin', () => track('form_started', { etf: $('#lead-etf').value }, { onlyOnce: true }));

// aria-invalid follows the visual :user-invalid state
for (const ev of ['input', 'change', 'blur']) {
  form.addEventListener(ev, (e) => {
    const i = e.target;
    if (!i.matches?.('input')) return;
    if (i.matches(':user-invalid')) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
  }, true);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = $('#form-status');
  if (!form.checkValidity()) {
    for (const i of form.querySelectorAll('input:invalid')) i.setAttribute('aria-invalid', 'true');
    form.classList.add('tried');
    form.querySelector('input:invalid')?.focus();
    return;
  }
  const btn = form.querySelector('button');
  btn.disabled = true;
  status.textContent = 'Odesílám…';
  const fd = new FormData(form);
  const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')));
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fd.get('email'), consent: fd.get('consent') === 'on', company: fd.get('company'),
        etf: fd.get('etf'), ad_version: adVersion, ...utm,
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    track('form_submitted', { etf: fd.get('etf') });
    status.textContent = 'Hotovo. Otevírám návod…';
    setTimeout(() => { location.href = guideUrl(location.search, fd.get('etf') || ''); }, 500);
  } catch (err) {
    track('form_error', { reason: String(err.message || err) });
    status.textContent = 'Něco se pokazilo. Zkuste to prosím znovu za chvíli.';
    btn.disabled = false;
  }
});

// ---------- comparison cards ----------
function renderPairs() {
  $('#pairs').innerHTML = data.pairs.map((p) => {
    const t = p.twin || p.proxy;
    const tt = val(t.xetra_ticker) || t.ticker;
    const row = (label, a, b) => `<tr><th scope="row">${label}</th><td>${a}</td><td>${b}</td></tr>`;
    return `
    <article class="pair">
      <div class="pair-head"><div class="swap"><span class="from">${esc(p.us.ticker)}</span><span class="arrow">→</span><span class="to">${esc(tt)}</span></div>
        ${p.twin ? (p.match === 'same_index' ? '<span class="badge">stejný index</span>' : '<span class="badge warn">podobný index</span>') : '<span class="badge warn">jen alternativa</span>'}</div>
      <table>
        <thead><tr><td></td><th scope="col">${esc(p.us.ticker)}</th><th scope="col">${esc(tt)}</th></tr></thead>
        <tbody>
          ${row('Index', esc(idx(p.us.index)), esc(idx(t.index)))}
          ${row('TER', pct(val(p.us.ter_pct)), pct(val(t.ter_pct)))}
          ${row('Výnosy', esc(dist(p.us.distribution)), esc(dist(t.distribution)))}
          ${row('Burza', esc(String(val(p.us.exchange)).split('/')[0]), 'Xetra (' + esc(val(t.trading_currency_xetra) || 'EUR') + ')')}
          ${row('Pro drobné investory v EU', 'většinou ne (chybí KID)', 'ano')}
        </tbody>
      </table>
      <p class="src">Zdroje: ${labelledSources([[p.us.ticker, p.us], [tt, t]])}</p>
    </article>`;
  }).join('');
}
