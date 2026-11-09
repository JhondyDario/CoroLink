// Botones comunes de la barra: idioma, modo oscuro, GitHub (con estrellas) y reportar/sugerir.
import { t, langSwitch } from './i18n.js';
import { icon } from './icons.js';

export const REPO = 'https://github.com/JhondyDario/CoroLink';
export const ISSUE_BUG = `${REPO}/issues/new?template=bug_report.yml`;
export const ISSUE_IDEA = `${REPO}/issues/new?template=feature_request.yml`;

// ---------- Modo oscuro (interruptor) ----------
const THEME_KEY = 'corolink.theme';
const darkNow = () => {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
export function setDark(on) {
  document.documentElement.dataset.theme = on ? 'dark' : 'light';
  try { localStorage.setItem(THEME_KEY, on ? 'dark' : 'light'); } catch { /* sin almacenamiento */ }
  syncThemeSwitches();
}
function syncThemeSwitches() {
  const dark = darkNow();
  document.querySelectorAll('[data-theme-switch]').forEach((b) => b.setAttribute('aria-checked', String(dark)));
}
function themeSwitch() {
  return `<button class="theme-switch" type="button" role="switch" data-theme-switch aria-checked="false" title="${t('Modo oscuro')}" aria-label="${t('Modo oscuro')}">
    <span class="ts-track">${icon('sun', { size: 13, cls: 'ts-sun' })}${icon('moon', { size: 13, cls: 'ts-moon' })}<span class="ts-thumb"></span></span>
  </button>`;
}

// ---------- Estrellas de GitHub (se guardan un rato para no pedirlas en cada página) ----------
async function loadStars() {
  const els = document.querySelectorAll('[data-stars]');
  if (!els.length) return;
  let n = null;
  try {
    const c = JSON.parse(sessionStorage.getItem('corolink.stars') || 'null');
    if (c && Date.now() - c.at < 10 * 60e3) n = c.n;
  } catch { /* nada */ }
  if (n === null) {
    try {
      const r = await fetch('https://api.github.com/repos/JhondyDario/CoroLink');
      if (r.ok) n = (await r.json()).stargazers_count;
      try { sessionStorage.setItem('corolink.stars', JSON.stringify({ n, at: Date.now() })); } catch { /* nada */ }
    } catch { /* sin internet o límite de la API: no mostramos número */ }
  }
  if (typeof n === 'number') els.forEach((el) => { el.textContent = n; el.hidden = false; });
}

// Botón "Danos una estrella" con el contador
export function starButton({ compact = false } = {}) {
  return `<a class="btn ghost sm gh-btn" href="${REPO}" target="_blank" rel="noopener" title="${t('Código abierto en GitHub')}">
    ${icon('github', { size: 16 })}<span class="${compact ? 'gh-label-c' : ''}">${t('Danos una estrella')}</span>${icon('star', { size: 14, cls: 'gh-star' })}<span class="gh-count" data-stars hidden></span></a>`;
}

// Menú de reportar / sugerir (botón + ventanita, sin <details> para que se alinee bien)
export function feedbackButton() {
  return `<div class="fb-menu">
    <button class="btn ghost sm icon-btn" type="button" data-fb-toggle aria-haspopup="true" aria-expanded="false" title="${t('¿Problema o idea?')}" aria-label="${t('¿Problema o idea?')}">${icon('message', { size: 17 })}</button>
    <div class="fb-pop" role="menu" hidden>
      <a role="menuitem" href="${ISSUE_BUG}" target="_blank" rel="noopener">${icon('bug', { size: 16 })} ${t('Reportar un problema')}</a>
      <a role="menuitem" href="${ISSUE_IDEA}" target="_blank" rel="noopener">${icon('bulb', { size: 16 })} ${t('Sugerir una mejora')}</a>
      <a role="menuitem" href="${REPO}" target="_blank" rel="noopener">${icon('github', { size: 16 })} ${t('Código abierto en GitHub')}</a>
    </div>
  </div>`;
}

// Pone los botones en un contenedor (al principio)
export function mountChrome(container, { star = true, feedback = true } = {}) {
  if (!container) return;
  container.insertAdjacentHTML('afterbegin', `${star ? starButton({ compact: true }) : ''}${feedback ? feedbackButton() : ''}${langSwitch()}${themeSwitch()}`);
  syncThemeSwitches();
  loadStars();
}

// Un solo manejador para toda la página
document.addEventListener('click', (e) => {
  const sw = e.target.closest('[data-theme-switch]');
  if (sw) { setDark(!darkNow()); return; }
  const fb = e.target.closest('[data-fb-toggle]');
  document.querySelectorAll('.fb-menu').forEach((m) => {
    const open = fb && m.contains(fb) ? m.querySelector('.fb-pop').hidden : false;
    m.querySelector('.fb-pop').hidden = !open;
    m.querySelector('[data-fb-toggle]').setAttribute('aria-expanded', String(open));
  });
});
// Tocar dentro de la vista previa (un iframe) no llega aquí, pero sí quita el foco de esta página
window.addEventListener('blur', () => {
  document.querySelectorAll('.fb-pop:not([hidden])').forEach((p) => { p.hidden = true; p.parentElement.querySelector('[data-fb-toggle]').setAttribute('aria-expanded', 'false'); });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.fb-pop:not([hidden])').forEach((p) => { p.hidden = true; p.parentElement.querySelector('[data-fb-toggle]').focus(); });
});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', syncThemeSwitches);
export { loadStars };
