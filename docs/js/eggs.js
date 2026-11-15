// Easter eggs: Konami rave, "outlaw" terminal, 7-click themes, idle screensaver, console art.
import { $, root, motion, finePointer, cards, h1, toast, glitch, themes, setTheme, buzz } from './common.js';

// Themes: click the name 7 times within 1.5s gaps
let clicks = 0, clickT;
h1.addEventListener('click', () => {
  glitch();
  clearTimeout(clickT);
  clickT = setTimeout(() => clicks = 0, 1500);
  if (++clicks < 7) return;
  clicks = 0;
  const next = themes[(themes.indexOf(root.dataset.theme || 'rgb') + 1) % themes.length];
  setTheme(next);
  buzz(30);
  toast(`theme: ${next}`);
});

// Konami rave
const isRave = () => document.body.classList.contains('rave');
function rave(on) {
  document.body.classList.toggle('rave', on);
  toast(on ? `RAVE MODE · ${finePointer ? 'Esc' : "'rave' again"} to stop` : 'rave over');
}

// Terminal: type "outlaw" anywhere
const term = $('.term'), out = $('#term-out'), input = $('#term-input');
const projects = cards.map(c => ({ name: c.querySelector('h2').textContent, url: c.href }));
let greeted = false;

function print(text, cls) {
  const d = document.createElement('div');
  d.textContent = text; // never innerHTML: input is user-typed
  if (cls) d.className = cls;
  out.append(d);
  out.scrollTop = out.scrollHeight;
}
function openTerm() {
  term.classList.add('open');
  if (!greeted) { greeted = true; print("you found the outlaw shell. type 'help'.", 'dim'); }
  requestAnimationFrame(() => input.focus());
}
function closeTerm() { term.classList.remove('open'); input.blur(); }
$('.term-close').addEventListener('click', closeTerm);

// Touch devices have no keyboard to type "outlaw": long-press the name instead
let pressT;
h1.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  clearTimeout(pressT);
  pressT = setTimeout(() => { buzz(40); glitch(); openTerm(); }, 650);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => h1.addEventListener(ev, () => clearTimeout(pressT)));
h1.addEventListener('contextmenu', e => e.preventDefault());

const cmds = {
  help: () => print('commands: ls, open <n|name>, whoami, theme [name], rave, support, sudo, clear, exit', 'dim'),
  ls: () => projects.forEach((p, i) => print(`${String(i + 1).padStart(2, '0')}  ${p.name}`)),
  open: a => {
    const q = a.join(' ').toLowerCase();
    const p = q && (projects[parseInt(q, 10) - 1] || projects.find(p => p.name.toLowerCase().includes(q)));
    if (!p) return print('usage: open <number|name>', 'err');
    print(`opening ${p.name}...`, 'ok');
    window.open(p.url, '_blank', 'noopener');
  },
  whoami: () => print('guest. but anyone who finds this shell is an outlaw at heart.'),
  theme: a => {
    if (!a[0]) return print(`themes: ${themes.join(', ')}`, 'dim');
    if (!themes.includes(a[0])) return print(`unknown theme: ${a[0]}`, 'err');
    setTheme(a[0]);
    print(`theme set: ${a[0]}`, 'ok');
  },
  rave: () => rave(!isRave()),
  support: () => {
    print('AID APP  https://aidapp.in/app/?ref=dev');
    print('Boosty   https://boosty.to/rgboutlaw/donate');
  },
  sudo: a => a.join(' ') === 'rm -rf boredom'
    ? print("boredom deleted. 0 files remaining. you're welcome.", 'ok')
    : print('guest is not in the sudoers file. This incident will be reported.', 'err'),
  clear: () => out.textContent = '',
  exit: closeTerm,
};

$('#term-form').addEventListener('submit', e => {
  e.preventDefault();
  const line = input.value.trim();
  input.value = '';
  print(`$ ${line}`, 'dim');
  if (!line) return;
  const [c, ...a] = line.split(/\s+/), cmd = c.toLowerCase();
  if (Object.hasOwn(cmds, cmd)) cmds[cmd](a);
  else print(`command not found: ${c}. try 'help'`, 'err');
});

// Keys: Esc closes things, Konami code, "outlaw"
const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kPos = 0, buf = '';
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (term.classList.contains('open')) closeTerm();
    else if (isRave()) rave(false);
    return;
  }
  if (e.target.closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  // physical letter keys, so "outlaw" and B/A work on a Russian layout too
  const key = /^Key[A-Z]$/.test(e.code) ? e.code[3].toLowerCase() : e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // extra ArrowUps keep the "↑↑" prefix alive
  kPos = key === konami[kPos] ? kPos + 1 : key === 'ArrowUp' ? (kPos === 2 ? 2 : 1) : 0;
  if (kPos === konami.length) { kPos = 0; rave(!isRave()); }
  if (key.length === 1) {
    buf = (buf + key).slice(-6);
    if (buf === 'outlaw') { buf = ''; e.preventDefault(); openTerm(); }
  }
});

// Idle screensaver: bouncing name after 60s without input
if (motion) {
  const idle = $('.idle'), logo = idle.querySelector('span');
  if (!finePointer) idle.querySelector('small').textContent = 'tap to wake up';
  let idleT, raf, x, y, vx, vy, h;
  function sleep() {
    idle.classList.add('on');
    x = Math.random() * (innerWidth - logo.offsetWidth);
    y = Math.random() * (innerHeight - logo.offsetHeight);
    vx = vy = 2; h = 160;
    (function frame() {
      const mx = innerWidth - logo.offsetWidth, my = innerHeight - logo.offsetHeight;
      x += vx; y += vy;
      if (x <= 0 || x >= mx) { vx = -vx; x = Math.max(0, Math.min(mx, x)); h = (h + 70) % 360; }
      if (y <= 0 || y >= my) { vy = -vy; y = Math.max(0, Math.min(my, y)); h = (h + 70) % 360; }
      logo.style.transform = `translate(${x}px, ${y}px)`;
      logo.style.setProperty('--h', h);
      raf = requestAnimationFrame(frame);
    })();
  }
  function wake() {
    clearTimeout(idleT);
    if (idle.classList.contains('on')) { idle.classList.remove('on'); cancelAnimationFrame(raf); }
    idleT = setTimeout(sleep, 60000);
  }
  ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart']
    .forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();
}

// For the curious ones in DevTools
console.log('%c' + String.raw`
 ____   ____ ____         ___        _   _ _  _
|  _ \ / ___| __ )       / _ \ _   _| |_| | || |__      __
| |_) | |  _|  _ \ _____| | | | | | | __| | || |\ \ /\ / /
|  _ <| |_| | |_) |_____| |_| | |_| | |_| |__   _\ V  V /
|_| \_\\____|____/       \___/ \__,_|\__|_|  |_|  \_/\_/
`, 'color:#00f5a0;font-family:monospace;font-weight:bold');
console.log('%chey, curious dev 👀  psst: try ↑↑↓↓←→←→BA, or just type "outlaw" on the page.', 'color:#9a98b3;font-size:13px');
