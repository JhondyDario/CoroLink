import { TEMPLATES, EVENT_TYPES, FONTS, fontsHref, newInvitation, applyTheme, sanitizeTheme } from './templates.js';
import { encodeData, buildHash } from './codec.js';
import { esc, parseDate, fmtDate } from './render.js';
import { tplCard } from './ui.js';
import { listDrafts, deleteDraft } from './store.js';

const $ = (s) => document.querySelector(s);

const fonts = document.createElement('link');
fonts.rel = 'stylesheet';
fonts.href = fontsHref(Object.keys(FONTS));
document.head.appendChild(fonts);

// Plantillas
let filter = '';
function renderTemplates() {
  const types = [...new Set(TEMPLATES.map((t) => t.type))];
  $('#tpl-filter').innerHTML = [['', 'Todas'], ...types.map((t) => [t, EVENT_TYPES[t]])]
    .map(([v, l]) => `<button type="button" class="chip ${filter === v ? 'on' : ''}" data-f="${v}">${l}</button>`).join('');
  $('#tpl-grid').innerHTML = TEMPLATES.filter((t) => !filter || t.type === filter)
    .map((t) => tplCard(t, { href: `crear.html?tpl=${t.id}` })).join('');
}
$('#tpl-filter').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (b) { filter = b.dataset.f; renderTemplates(); }
});
renderTemplates();

// Mis invitaciones
function renderDrafts() {
  const ds = listDrafts();
  $('#mis').hidden = !ds.length;
  $('#drafts').innerHTML = ds.map((d) => {
    const th = sanitizeTheme(d.inv.theme);
    const dt = parseDate(d.inv.ev?.date, d.inv.ev?.time);
    return `<div class="draft">
      <div class="sw" style="background:linear-gradient(135deg, ${th.primary}, ${th.accent})"></div>
      <div class="info"><b>${esc(d.inv.ev?.names || 'Sin título')}</b><small>${dt ? esc(fmtDate(dt)) : ''} · ${d.guests?.length || 0} invitados</small></div>
      <div class="acts"><a class="btn sm" href="crear.html?id=${esc(d.id)}">Editar</a><button class="btn ghost sm" data-del="${esc(d.id)}" type="button" aria-label="Borrar">×</button></div>
    </div>`;
  }).join('');
}
$('#drafts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-del]');
  if (b && confirm('¿Borrar esta invitación de este navegador? Los links que ya enviaste siguen funcionando.')) { deleteDraft(b.dataset.del); renderDrafts(); }
});
renderDrafts();

// Demos en vivo en la portada
async function demo(id, tplId) {
  const tpl = TEMPLATES.find((t) => t.id === tplId);
  const inv = applyTheme(newInvitation(tpl), tpl);
  inv.theme.envelope = false;
  $(id).src = 'i.html' + buildHash(await encodeData(inv), { name: 'Familia Pérez', passes: 4 });
}
demo('#demo1', 'xv-mariposas');
demo('#demo2', 'boda-dorada');
