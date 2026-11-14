// Page behaviour and animations. All motion is skipped under prefers-reduced-motion.
import { $, root, motion, finePointer, cards, h1, glitch } from './common.js';

document.getElementById('y').textContent = new Date().getFullYear();

// Staggered card reveal on scroll (delay cleared afterwards so hover isn't delayed)
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  io.unobserve(e.target);
  setTimeout(() => e.target.style.transitionDelay = '', 600);
}), { threshold: .1 });
cards.forEach((c, i) => { c.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(c); });

// Card spotlight + 3D tilt toward the cursor
cards.forEach(c => {
  // pointerdown too, so on touch the press spotlight starts under the finger
  const spot = e => {
    const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    c.style.setProperty('--mx', x + 'px');
    c.style.setProperty('--my', y + 'px');
    return [r, x, y];
  };
  c.addEventListener('pointerdown', spot);
  c.addEventListener('pointermove', e => {
    const [r, x, y] = spot(e);
    if (motion && finePointer) {
      c.style.setProperty('--ry', (x / r.width - .5) * 10 + 'deg');
      c.style.setProperty('--rx', (.5 - y / r.height) * 10 + 'deg');
    }
  });
  c.addEventListener('pointerleave', () => { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
});

// Category filter
document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
  b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: motion ? 'smooth' : 'auto' }); // swipeable row on phones
  cards.forEach(c => c.hidden = b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f);
}));

// Typing tagline (min-height reserved so the layout doesn't jump)
if (motion) {
  const typed = $('#typed'), full = typed.textContent, lead = typed.parentElement;
  lead.style.minHeight = lead.offsetHeight + 'px';
  typed.textContent = '';
  let i = 0;
  setTimeout(function step() {
    typed.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(step, 25 + Math.random() * 45);
  }, 500);
}

// Glitch the name every few seconds and on hover
if (motion) {
  (function loop() { setTimeout(() => { glitch(); loop(); }, 3000 + Math.random() * 4000); })();
  h1.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') glitch(); });
}

if (motion && finePointer) {
  // Magnetic buttons: pull toward the cursor, at most `max` px
  function magnet(el, area, k, max) {
    const cl = v => Math.max(-max, Math.min(max, v));
    area.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.translate = `${cl((e.clientX - r.left - r.width / 2) * k)}px ${cl((e.clientY - r.top - r.height / 2) * k)}px`;
    });
    area.addEventListener('pointerleave', () => el.style.translate = '');
  }
  const cta = $('.cta');
  magnet(cta, cta, .3, 10);
  document.querySelectorAll('.sup').forEach(s => magnet(s.querySelector('.btn'), s, .12, 10));

  // Background blobs lean toward the mouse (CSS reads --px/--py, -1..1)
  addEventListener('pointermove', e => {
    root.style.setProperty('--px', (e.clientX / innerWidth - .5) * 2);
    root.style.setProperty('--py', (e.clientY / innerHeight - .5) * 2);
  });
}
