// Piezas de interfaz compartidas por la portada y el editor.
import { EVENT_TYPES, CATEGORIES, categoryOf, cornerSVG, sanitizeTheme } from './templates.js';
import { esc } from './render.js';
import { isFav, listFavs } from './store.js';
import { lang } from './i18n.js';
import { TEMPLATES_EN } from './templates.en.js';

export function tplCard(t, { mine = false, active = false, href = '' } = {}) {
  const th = sanitizeTheme(t.theme);
  const tag = href ? 'a' : 'div';
  const attrs = href ? `href="${esc(href)}"` : 'role="button" tabindex="0"';
  const fav = isFav(t.id);
  const ev = (lang === 'en' && TEMPLATES_EN[t.id]) || t.ev || {};
  return `<${tag} class="tpl ${active ? 'on' : ''}" data-id="${esc(t.id)}" data-mine="${mine ? 1 : ''}" ${attrs} aria-label="Plantilla ${esc(t.name)}">
    <div class="tpl-thumb" style="background:${th.bg}">
      <div class="tpl-card l-${th.layout}" style="background:${th.card};color:${th.text}">
        <div class="tpl-corner">${cornerSVG(th.deco, th)}</div>
        <small style="color:${th.accent}">${esc(ev.pre || '')}</small>
        <b style="font-family:'${th.fontTitle}'">${esc(ev.names || t.name)}</b>
      </div>
      <button class="fav ${fav ? 'on' : ''}" data-fav="${esc(t.id)}" type="button" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de favoritas' : 'Agregar a favoritas'}">${fav ? '★' : '☆'}</button>
      ${t.inv ? '<span class="tpl-badge">Con contenido</span>' : ''}
    </div>
    <div class="tpl-meta"><span>${esc(t.name)}</span><em>${esc(EVENT_TYPES[t.type] || '')}</em>
    ${mine ? `<button class="x" data-del="${esc(t.id)}" type="button" aria-label="Borrar plantilla">×</button>` : ''}</div>
  </${tag}>`;
}

// Filtros de la galería: favoritas, mis plantillas y las categorías
export function filterChips(current, { favs = 0, mine = 0 } = {}) {
  const opts = [['', 'Todas']];
  if (favs) opts.push(['fav', `★ Favoritas (${favs})`]);
  if (mine) opts.push(['mine', `Mis plantillas (${mine})`]);
  Object.entries(CATEGORIES).forEach(([k, c]) => opts.push([k, c.name]));
  return opts.map(([v, l]) => `<button type="button" class="chip ${current === v ? 'on' : ''}" data-f="${v}">${l}</button>`).join('');
}

// Devuelve [{t, mine}] según el filtro. Las favoritas salen primero en "Todas".
export function filterTemplates(builtIn, mine, filter) {
  const favs = listFavs();
  const all = [...mine.map((t) => ({ t, mine: true })), ...builtIn.map((t) => ({ t, mine: false }))];
  if (filter === 'fav') return all.filter((x) => favs.includes(x.t.id)).sort((a, b) => favs.indexOf(a.t.id) - favs.indexOf(b.t.id));
  if (filter === 'mine') return all.filter((x) => x.mine);
  if (filter) return all.filter((x) => !x.mine && categoryOf(x.t.type) === filter);
  return builtIn.map((t) => ({ t, mine: false })).sort((a, b) => (favs.includes(b.t.id) ? 1 : 0) - (favs.includes(a.t.id) ? 1 : 0));
}
