// Shared helpers for effects.js and eggs.js

export const $ = s => document.querySelector(s);
export const root = document.documentElement;
export const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const cards = [...document.querySelectorAll('.card')];
export const h1 = $('h1');

const toastEl = $('.toast');
let toastT;
export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// Red/cyan glitch on the name (~300ms)
export function glitch() {
  if (!motion) return;
  h1.classList.remove('glitch');
  void h1.offsetWidth; // restart the CSS animation
  h1.classList.add('glitch');
  setTimeout(() => h1.classList.remove('glitch'), 340);
}

export const themes = ['rgb', 'matrix', 'synthwave', 'mono'];
export function setTheme(t) {
  if (t === 'rgb') delete root.dataset.theme;
  else root.dataset.theme = t;
}
