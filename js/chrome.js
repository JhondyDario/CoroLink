// Botones comunes de la barra: idioma, modo oscuro, GitHub (con estrellas) y reportar/sugerir.
import { t, langSwitch } from './i18n.js';

export const REPO = 'https://github.com/JhondyDario/CoroLink';
export const ISSUE_BUG = `${REPO}/issues/new?template=bug_report.yml`;
export const ISSUE_IDEA = `${REPO}/issues/new?template=feature_request.yml`;

// ---------- Modo oscuro ----------
const THEME_KEY = 'corolink.theme';
const darkNow = () => {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
export function toggleTheme() {
  const next = darkNow() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY, next); } catch { /* sin almacenamiento */ }
  syncThemeButtons();
}
function syncThemeButtons() {
  const dark = darkNow();
  document.querySelectorAll('[data-theme-btn]').forEach((b) => {
    b.textContent = dark ? '☀️' : '🌙';
    b.title = t(dark ? 'Modo claro' : 'Modo oscuro');
    b.setAttribute('aria-label', b.title);
  });
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

const ghIcon = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

// Botón "⭐ Danos una estrella" con el contador
export function starButton({ compact = false } = {}) {
  return `<a class="btn ghost sm gh-btn" href="${REPO}" target="_blank" rel="noopener" title="${t('Código abierto en GitHub')}">
    ${ghIcon}<span class="${compact ? 'gh-label-c' : ''}">⭐ ${t('Danos una estrella')}</span><span class="gh-count" data-stars hidden></span></a>`;
}

// Menú de reportar / sugerir
export function feedbackButton() {
  return `<details class="fb-menu">
    <summary class="btn ghost sm" title="${t('¿Problema o idea?')}" aria-label="${t('¿Problema o idea?')}">💬</summary>
    <div class="fb-pop">
      <a href="${ISSUE_BUG}" target="_blank" rel="noopener">🐞 ${t('Reportar un problema')}</a>
      <a href="${ISSUE_IDEA}" target="_blank" rel="noopener">💡 ${t('Sugerir una mejora')}</a>
      <a href="${REPO}" target="_blank" rel="noopener">${ghIcon} ${t('Código abierto en GitHub')}</a>
    </div>
  </details>`;
}

// Pone los botones en un contenedor (al principio)
export function mountChrome(container, { star = true, feedback = true } = {}) {
  if (!container) return;
  const html = `${star ? starButton({ compact: true }) : ''}${feedback ? feedbackButton() : ''}${langSwitch()}<button class="btn ghost sm icon-btn" type="button" data-theme-btn></button>`;
  container.insertAdjacentHTML('afterbegin', html);
  container.addEventListener('click', (e) => { if (e.target.closest('[data-theme-btn]')) toggleTheme(); });
  syncThemeButtons();
  loadStars();
  // Cerrar el menú de reportar al tocar fuera
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.fb-menu[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; });
  });
}
export { loadStars, syncThemeButtons };
