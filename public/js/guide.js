// Personalises the guide with the fund the visitor picked (?etf=voo).
import { track } from './track.js';

const id = new URLSearchParams(location.search).get('etf');
track('guide_viewed', { etf: id || '' }, { onlyOnce: true });

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

if (id) {
  fetch('/data/etfs.json').then((r) => r.json()).then((d) => {
    const p = d.pairs.find((x) => x.id === id);
    if (!p) return;
    const t = p.twin || p.proxy;
    const el = document.getElementById('your-fund');
    el.innerHTML = `<p>Místo <span class="mono">${esc(p.us.ticker)}</span> hledejte:</p>
      <p class="big mono">${esc(t.isin.value)}</p>
      <p>${esc(t.name.value)}<br>Xetra: <span class="mono">${esc(t.xetra_ticker?.value || t.ticker)}</span></p>`;
    el.hidden = false;
  }).catch(() => {});
}
