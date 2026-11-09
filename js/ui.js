// Piezas de interfaz compartidas por la portada y el editor.
import { EVENT_TYPES, cornerSVG, sanitizeTheme } from './templates.js';
import { esc } from './render.js';

export function tplCard(t, { mine = false, active = false, href = '' } = {}) {
  const th = sanitizeTheme(t.theme);
  const tag = href ? 'a' : 'div';
  const attrs = href ? `href="${esc(href)}"` : 'role="button" tabindex="0"';
  return `<${tag} class="tpl ${active ? 'on' : ''}" data-id="${esc(t.id)}" data-mine="${mine ? 1 : ''}" ${attrs} aria-label="Plantilla ${esc(t.name)}">
    <div class="tpl-thumb" style="background:${th.bg}">
      <div class="tpl-card l-${th.layout}" style="background:${th.card};color:${th.text}">
        <div class="tpl-corner">${cornerSVG(th.deco, th)}</div>
        <small style="color:${th.accent}">${esc(t.ev?.pre || '')}</small>
        <b style="font-family:'${th.fontTitle}'">${esc(t.ev?.names || t.name)}</b>
      </div>
    </div>
    <div class="tpl-meta"><span>${esc(t.name)}</span><em>${esc(EVENT_TYPES[t.type] || '')}</em>
    ${mine ? `<button class="x" data-del="${esc(t.id)}" type="button" aria-label="Borrar plantilla">×</button>` : ''}</div>
  </${tag}>`;
}
