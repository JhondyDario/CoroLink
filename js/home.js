import { TEMPLATES, FONTS, fontsHref, newInvitation, applyTheme, sanitizeTheme } from './templates.js';
import { encodeData, buildHash } from './codec.js';
import { esc, parseDate, fmtDate } from './render.js';
import { tplCard, filterChips, filterTemplates } from './ui.js';
import { listDrafts, deleteDraft, getDraft, listMyTemplates, deleteMyTemplate, listFavs, toggleFav, duplicateDraft, templateFromInvitation } from './store.js';

const $ = (s) => document.querySelector(s);

const fonts = document.createElement('link');
fonts.rel = 'stylesheet';
fonts.href = fontsHref(Object.keys(FONTS));
document.head.appendChild(fonts);

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2400);
}

// ---------- Plantillas ----------
let filter = '';
function renderTemplates() {
  const mine = listMyTemplates();
  const ids = new Set([...TEMPLATES, ...mine].map((t) => t.id));
  const favs = listFavs().filter((id) => ids.has(id)).length;
  if ((filter === 'fav' && !favs) || (filter === 'mine' && !mine.length)) filter = '';
  $('#tpl-filter').innerHTML = filterChips(filter, { favs, mine: mine.length });
  $('#tpl-grid').innerHTML = filterTemplates(TEMPLATES, mine, filter)
    .map(({ t, mine: m }) => tplCard(t, { mine: m, href: `crear.html?tpl=${encodeURIComponent(t.id)}` })).join('');
}
$('#tpl-filter').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (b) { filter = b.dataset.f; renderTemplates(); }
});
$('#tpl-grid').addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  const del = e.target.closest('[data-del]');
  if (!fav && !del) return;
  e.preventDefault(); // las tarjetas son links: que la estrella no abra el editor
  if (fav) toast(toggleFav(fav.dataset.fav) ? 'Agregada a favoritas ★' : 'Quitada de favoritas');
  if (del && confirm('¿Borrar esta plantilla?')) deleteMyTemplate(del.dataset.del);
  renderTemplates();
});
renderTemplates();

// ---------- Mis invitaciones ----------
function renderDrafts() {
  const ds = listDrafts();
  $('#mis').hidden = !ds.length;
  $('#drafts').innerHTML = ds.map((d) => {
    const th = sanitizeTheme(d.inv.theme);
    const dt = parseDate(d.inv.ev?.date, d.inv.ev?.time);
    return `<div class="draft">
      <div class="draft-top">
        <div class="sw" style="background:linear-gradient(135deg, ${th.primary}, ${th.accent})"></div>
        <div class="info"><b>${esc(d.inv.ev?.names || 'Sin título')}</b><small>${dt ? esc(fmtDate(dt)) : ''} · ${d.guests?.length || 0} invitados</small></div>
      </div>
      <div class="acts">
        <a class="btn sm" href="crear.html?id=${esc(d.id)}">Editar</a>
        <a class="btn ghost sm" href="invitados.html?id=${esc(d.id)}">Invitados</a>
        <button class="btn ghost sm" data-dup="${esc(d.id)}" type="button">Duplicar</button>
        <button class="btn ghost sm" data-tpl="${esc(d.id)}" type="button">Hacer plantilla</button>
        <button class="btn ghost sm" data-del="${esc(d.id)}" type="button" aria-label="Borrar">×</button>
      </div>
    </div>`;
  }).join('');
}
$('#drafts').addEventListener('click', (e) => {
  const del = e.target.closest('[data-del]');
  const dup = e.target.closest('[data-dup]');
  const tpl = e.target.closest('[data-tpl]');
  if (del && confirm('¿Borrar esta invitación de este navegador? Los links que ya enviaste siguen funcionando.')) { deleteDraft(del.dataset.del); renderDrafts(); }
  if (dup) {
    const c = duplicateDraft(dup.dataset.dup);
    if (c) { renderDrafts(); toast('Invitación duplicada (sin la lista de invitados)'); } else toast('No se pudo duplicar');
  }
  if (tpl) {
    const d = getDraft(tpl.dataset.tpl);
    const name = d && prompt('Nombre para tu plantilla:', d.inv.ev?.names || 'Mi plantilla');
    if (!name) return;
    if (templateFromInvitation(d.inv, name, true)) {
      filter = 'mine';
      renderTemplates();
      toast('Plantilla guardada con diseño y contenido');
      $('#plantillas').scrollIntoView({ behavior: 'smooth' });
    } else toast('No se pudo guardar (¿fotos muy pesadas?)');
  }
});
renderDrafts();

// ---------- Demos en vivo en la portada ----------
async function demo(id, tplId) {
  const tpl = TEMPLATES.find((t) => t.id === tplId);
  const inv = applyTheme(newInvitation(tpl), tpl);
  inv.theme.envelope = false;
  $(id).src = 'i.html' + buildHash(await encodeData(inv), { name: 'Familia Pérez', passes: 4 });
}
demo('#demo1', 'xv-mariposas');
demo('#demo2', 'torneo');
