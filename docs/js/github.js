// Live GitHub info: release/updated line on each card + contribution heatmap.
// Data comes from data/github.json, built by .github/workflows/pages.yml, so visitors never hit the API.
// If the file is missing, the page simply stays as it is.
import { $, root, motion, cards } from './common.js';

const ru = root.lang === 'ru';
const t = ru
  ? { updated: 'обновлено', contrib: n => `${n} ${new Intl.PluralRules('ru').select(n) === 'one' ? 'вклад' : new Intl.PluralRules('ru').select(n) === 'few' ? 'вклада' : 'вкладов'} за последний год` }
  : { updated: 'updated', contrib: n => `${n} contribution${n === 1 ? '' : 's'} in the last year` };

const rtf = new Intl.RelativeTimeFormat(root.lang, { numeric: 'auto' });
const UNITS = [['year', 31536e3], ['month', 2592e3], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
function ago(iso) {
  const s = (Date.parse(iso) - Date.now()) / 1000;
  const [u, n] = UNITS.find(([, n]) => Math.abs(s) >= n) || ['minute', 60];
  return rtf.format(Math.round(s / n), u);
}

function span(cls, text) {
  const s = document.createElement('span');
  if (cls) s.className = cls;
  if (text) s.textContent = text;
  return s;
}

function cardInfo(repos) {
  for (const c of cards) {
    const r = repos[new URL(c.href).pathname.split('/')[1].toLowerCase()];
    if (!r) continue;
    const el = document.createElement('div');
    el.className = 'rel';
    // dot pulses when the repo was pushed in the last 30 days
    if (Date.now() - Date.parse(r.pushed) < 30 * 864e5) el.append(span('live'));
    el.append(span('', r.release ? `${r.release.tag} · ${ago(r.release.date)}` : `${t.updated} ${ago(r.pushed)}`));
    if (r.stars) el.append(span('stars', `★ ${r.stars}`));
    c.querySelector('.go').before(el);
  }
}

function heatmap({ total, start, counts }) {
  const sec = $('.heat'), grid = sec.querySelector('.heat-grid');
  const pad = new Date(start + 'T00:00Z').getUTCDay(); // calendar weeks start on Sunday
  // GitHub-style levels: quartiles of the non-zero days
  const nz = counts.filter(Boolean).sort((a, b) => a - b), q = p => nz[Math.floor(p * (nz.length - 1))];
  const level = n => n <= q(.25) ? 1 : n <= q(.5) ? 2 : n <= q(.75) ? 3 : 4;
  const fmt = new Intl.DateTimeFormat(root.lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const frag = document.createDocumentFragment();
  for (let i = 0; i < pad; i++) frag.append(span('pad'));
  counts.forEach((n, i) => {
    const cell = document.createElement('i'), col = Math.floor((pad + i) / 7);
    cell.style.setProperty('--w', col);
    if (n) cell.dataset.l = level(n);
    cell.title = `${n} · ${fmt.format(Date.parse(start + 'T00:00Z') + i * 864e5)}`;
    frag.append(cell);
  });
  grid.append(frag);
  sec.querySelector('.heat-cap').textContent = t.contrib(total);
  sec.hidden = false;
  if (motion) sec.classList.add('anim');
  grid.scrollLeft = grid.scrollWidth; // narrow screens: show the latest weeks first
}

try {
  const res = await fetch(new URL('../data/github.json', import.meta.url));
  if (res.ok) {
    const d = await res.json();
    cardInfo(d.repos);
    heatmap(d.contrib);
  }
} catch { /* no data: page works without it */ }
