import { encodeData, decodeData, buildHash } from './codec.js';
import { TEMPLATES, FONTS, DECOS, LAYOUTS, PATTERNS, EVENT_TYPES, CATEGORIES, categoryOf, RSVP_FIELDS, defaultRsvpFields, MAX_PEOPLE, MIN_GUESTS, getTemplate, newInvitation, applyTheme, fontsHref, sanitizeTheme } from './templates.js';
import { esc, safeUrl, waPhone } from './render.js';
import { tplCard } from './ui.js';
import { getDraft, saveDraft, updateDraft, uid, listMyTemplates, saveMyTemplate, deleteMyTemplate } from './store.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const DEFAULT_MSG = 'Hola {nombre} 💌 Te tenemos una invitación especial. Ábrela aquí:\n{link}';

// ---------- Estado ----------
const params = new URLSearchParams(location.search);
let draft = params.get('id') && getDraft(params.get('id'));
if (!draft) {
  const tpl = getTemplate(params.get('tpl')) || listMyTemplates().find((t) => t.id === params.get('tpl')) || TEMPLATES[0];
  const inv = newInvitation(TEMPLATES.includes(tpl) ? tpl : TEMPLATES[0]);
  applyTheme(inv, tpl);
  if (tpl.type) inv.ev.type = tpl.type;
  if (tpl.ev) Object.assign(inv.ev, { pre: tpl.ev.pre, names: tpl.ev.names, msg: tpl.ev.msg });
  draft = { id: uid(), inv, guests: [], msg: DEFAULT_MSG };
  saveDraft(draft);
  history.replaceState(null, '', `?id=${draft.id}`);
}
let inv = draft.inv;
inv.rsvp ??= {};
inv.rsvp.fields = { ...defaultRsvpFields(), ...(inv.rsvp.fields || {}) };
inv.show.table ??= true;

const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), inv);
function set(path, val) {
  const keys = path.split('.');
  let o = inv;
  keys.slice(0, -1).forEach((k) => (o = o[k] ??= {}));
  o[keys.at(-1)] = val;
}

// ---------- Guardado ----------
const saveState = $('#save-state');
const persist = debounce(() => {
  const ok = !!updateDraft(draft.id, (d) => { d.inv = inv; d.msg = draft.msg; });
  saveState.textContent = ok ? 'Guardado' : 'No se pudo guardar (¿fotos muy pesadas?)';
  saveState.classList.toggle('err', !ok);
}, 500);

function changed({ rerenderForm = false } = {}) {
  saveState.textContent = 'Guardando…';
  saveState.classList.remove('err');
  persist();
  pushPreviewSoon();
  refreshShare();
  if (rerenderForm) fillForm();
}

// ---------- Toast ----------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2200);
}

// ---------- Fuentes del editor (para miniaturas y selectores) ----------
const allFonts = document.createElement('link');
allFonts.rel = 'stylesheet';
allFonts.href = fontsHref(Object.keys(FONTS));
document.head.appendChild(allFonts);

// ---------- Pestañas ----------
function openTab(name) {
  $$('.tabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $$('.tab').forEach((t) => t.classList.toggle('on', t.id === 'tab-' + name));
  $('.tab-body').scrollTop = 0;
  if (name === 'enviar') refreshShare(true);
}
$$('.tabs [data-tab]').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));
$('#go-share').addEventListener('click', () => { openTab('enviar'); document.body.classList.remove('show-preview'); });

// ---------- Plantillas ----------
let tplFilter = '';
function renderTemplates() {
  $('#tpl-filter').innerHTML = [['', 'Todas'], ...Object.entries(CATEGORIES).map(([k, c]) => [k, c.name])]
    .map(([v, l]) => `<button type="button" class="chip ${tplFilter === v ? 'on' : ''}" data-f="${v}">${l}</button>`).join('');
  $('#tpl-grid').innerHTML = TEMPLATES.filter((t) => !tplFilter || categoryOf(t.type) === tplFilter).map((t) => tplCard(t, { active: inv.tpl === t.id })).join('');
  const mine = listMyTemplates();
  $('#my-tpl-grid').innerHTML = mine.map((t) => tplCard(t, { mine: true, active: inv.tpl === t.id })).join('');
  $('#my-tpl-empty').hidden = mine.length > 0;
}
$('#tpl-filter').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (b) { tplFilter = b.dataset.f; renderTemplates(); }
});
function pickTemplate(e) {
  const del = e.target.closest('[data-del]');
  if (del) {
    if (confirm('¿Borrar esta plantilla?')) { deleteMyTemplate(del.dataset.del); renderTemplates(); }
    return;
  }
  const card = e.target.closest('.tpl');
  if (!card || (e.type === 'keydown' && e.key !== 'Enter')) return;
  const t = card.dataset.mine ? listMyTemplates().find((x) => x.id === card.dataset.id) : getTemplate(card.dataset.id);
  if (!t) return;
  applyTheme(inv, { ...t, theme: sanitizeTheme(t.theme) });
  renderTemplates();
  changed({ rerenderForm: true });
  toast(`Plantilla "${t.name}" aplicada`);
}
['#tpl-grid', '#my-tpl-grid'].forEach((s) => { $(s).addEventListener('click', pickTemplate); $(s).addEventListener('keydown', pickTemplate); });

$('#tpl-save').addEventListener('click', () => {
  const name = prompt('Nombre para tu plantilla:', 'Mi diseño');
  if (!name) return;
  saveMyTemplate({ id: 'mi-' + uid(), name: name.slice(0, 40), type: inv.ev.type, theme: sanitizeTheme(inv.theme), ev: { pre: inv.ev.pre, names: inv.ev.names, msg: inv.ev.msg } });
  renderTemplates();
  toast('Plantilla guardada en "Mis plantillas"');
});
$('#tpl-export').addEventListener('click', () => {
  download(`plantilla-${slug(inv.ev.names)}.json`, JSON.stringify({ convida: 'template', v: 1, name: inv.ev.names || 'Mi plantilla', type: inv.ev.type, theme: sanitizeTheme(inv.theme), ev: { pre: inv.ev.pre, names: inv.ev.names, msg: inv.ev.msg } }, null, 2), 'application/json');
});
$('#tpl-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.convida !== 'template' || !j.theme) throw new Error();
    const str = (s, n) => String(s || '').slice(0, n);
    saveMyTemplate({ id: 'mi-' + uid(), name: str(j.name, 40) || 'Importada', type: EVENT_TYPES[j.type] ? j.type : 'fiesta', theme: sanitizeTheme(j.theme), ev: { pre: str(j.ev?.pre, 80), names: str(j.ev?.names, 80), msg: str(j.ev?.msg, 600) } });
    renderTemplates();
    toast('Plantilla importada');
  } catch { toast('Ese archivo no es una plantilla de Convida'); }
});

// ---------- Diseño ----------
function chips(el, options, path) {
  const cur = get(path);
  $(el).innerHTML = Object.entries(options).map(([v, l]) => `<button type="button" class="chip ${cur === v ? 'on' : ''}" data-v="${v}">${typeof l === 'string' ? l : l.name}</button>`).join('');
}
function bindChips(el, path) {
  $(el).addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    set(path, b.dataset.v);
    $$('.chip', $(el)).forEach((c) => c.classList.toggle('on', c === b));
    changed();
  });
}
bindChips('#layout-chips', 'theme.layout');
bindChips('#deco-chips', 'theme.deco');
bindChips('#pattern-chips', 'theme.pattern');

const PALETTES = TEMPLATES.map((t) => t.theme);
function renderPalettes() {
  $('#palettes').innerHTML = PALETTES.map((p, i) => `<button type="button" class="pal" data-i="${i}" title="Paleta">${['bg', 'card', 'primary', 'accent', 'text'].map((k) => `<i style="background:${p[k]}"></i>`).join('')}</button>`).join('');
}
$('#palettes').addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  const p = PALETTES[b.dataset.i];
  ['bg', 'card', 'text', 'primary', 'accent'].forEach((k) => set('theme.' + k, p[k]));
  changed({ rerenderForm: true });
});

const fontOpts = Object.entries(FONTS).map(([f, k]) => `<option value="${f}" style="font-family:'${f}'">${f} · ${k}</option>`).join('');
$('#font-title').innerHTML = fontOpts;
$('#font-body').innerHTML = fontOpts;
$('#ev-type').innerHTML = Object.entries(EVENT_TYPES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

// ---------- Inputs con data-bind ----------
function fillForm() {
  $$('[data-bind]').forEach((el) => {
    const v = get(el.dataset.bind);
    if (el.type === 'checkbox') el.checked = v !== false;
    else if (document.activeElement !== el) el.value = v ?? '';
  });
  chips('#layout-chips', LAYOUTS, 'theme.layout');
  chips('#deco-chips', DECOS, 'theme.deco');
  chips('#pattern-chips', PATTERNS, 'theme.pattern');
  renderLists();
  renderGallery();
  renderToggles();
  renderRsvpFields();
  fillCover();
}
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-bind]');
  if (!el) return;
  set(el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
  changed();
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-bind]');
  if (el && (el.type === 'checkbox' || el.tagName === 'SELECT')) { set(el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value); changed(); }
});

// ---------- Listas (lugares, itinerario, regalos) ----------
const LISTS = {
  places: { root: () => inv.places, fields: [['label', 'Título (Ceremonia, Recepción…)'], ['name', 'Nombre del lugar'], ['addr', 'Dirección'], ['time', 'Hora', 'time']], blank: { label: 'Recepción', name: '', addr: '', time: '' } },
  itin: { root: () => inv.itin, fields: [['time', 'Hora', 'time'], ['label', '¿Qué pasa?']], blank: { time: '', label: '' } },
  gifts: { root: () => (inv.gifts.items ??= []), fields: [['label', 'Título (Transferencia, Mesa de regalos…)'], ['detail', 'Cuenta, número o link']], blank: { label: '', detail: '' } },
};
function renderLists() {
  for (const [key, L] of Object.entries(LISTS)) {
    const arr = L.root() || [];
    $(`#${key}-list`).innerHTML = arr.map((item, i) => `<div class="item" data-list="${key}" data-i="${i}">
      ${L.fields.map(([f, ph, type]) => `<input ${type ? `type="${type}"` : ''} data-f="${f}" placeholder="${ph}" value="${esc(item[f] || '')}" aria-label="${ph}">`).join('')}
      <div class="item-tools">
        <button type="button" data-move="-1" aria-label="Subir">↑</button>
        <button type="button" data-move="1" aria-label="Bajar">↓</button>
        <button type="button" data-rm aria-label="Eliminar">×</button>
      </div></div>`).join('');
  }
}
$('#tab-contenido').addEventListener('input', (e) => {
  const item = e.target.closest('.item');
  if (!item || !e.target.dataset.f) return;
  LISTS[item.dataset.list].root()[item.dataset.i][e.target.dataset.f] = e.target.value;
  changed();
});
$('#tab-contenido').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const L = LISTS[add.dataset.add];
    if (add.dataset.add === 'places' && !inv.places) inv.places = [];
    if (add.dataset.add === 'itin' && !inv.itin) inv.itin = [];
    L.root().push({ ...L.blank });
    renderLists();
    changed();
    return;
  }
  const item = e.target.closest('.item');
  if (!item) return;
  const arr = LISTS[item.dataset.list].root(), i = +item.dataset.i;
  if (e.target.closest('[data-rm]')) arr.splice(i, 1);
  else if (e.target.closest('[data-move]')) {
    const j = i + +e.target.closest('[data-move]').dataset.move;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  } else return;
  renderLists();
  changed();
});

// ---------- Imágenes ----------
function compressImage(file, max, quality = 0.62) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let url = c.toDataURL('image/webp', quality);
      if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(img.src);
      res(url);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
$('#cover-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  inv.cover = await compressImage(f, 720);
  fillCover();
  changed();
  toast('Foto agregada');
});
$('#cover-clear').addEventListener('click', () => { inv.cover = ''; fillCover(); changed(); });

function renderGallery() {
  $('#gallery-list').innerHTML = (inv.gallery || []).map((u, i) => `<div class="thumb"><img src="${esc(safeUrl(u, { image: true }))}" alt=""><button type="button" data-g="${i}" aria-label="Quitar">×</button></div>`).join('');
}
$('#gallery-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-g]');
  if (!b) return;
  inv.gallery.splice(+b.dataset.g, 1);
  renderGallery();
  changed();
});
$('#gallery-add').addEventListener('click', () => {
  const u = safeUrl($('#gallery-url').value);
  if (!u) return toast('Pega un link que empiece con https://');
  (inv.gallery ??= []).push(u);
  inv.show.gallery = true;
  $('#gallery-url').value = '';
  renderGallery();
  renderToggles();
  changed();
});
$('#gallery-file').addEventListener('change', async (e) => {
  const files = [...e.target.files].slice(0, 6);
  e.target.value = '';
  for (const f of files) (inv.gallery ??= []).push(await compressImage(f, 480, 0.55));
  if (files.length) { inv.show.gallery = true; renderGallery(); renderToggles(); changed(); toast(`${files.length} foto(s) agregada(s)`); }
});
// Campo de portada: un link, o "(foto subida)" si la foto va dentro del link
const coverInput = $('#cover-url');
coverInput.addEventListener('input', () => {
  const v = coverInput.value.trim();
  if (v === '(foto subida)') return;
  inv.cover = safeUrl(v) ? v : '';
  changed();
});
function fillCover() { coverInput.value = inv.cover?.startsWith('data:') ? '(foto subida)' : inv.cover || ''; }

// ---------- Secciones ----------
const SECTIONS = { countdown: 'Cuenta regresiva', places: 'Lugares y mapa', itin: 'Itinerario', dress: 'Vestimenta', gifts: 'Regalos', gallery: 'Galería de fotos', calendar: 'Agregar al calendario', rsvp: 'Confirmación de asistencia', table: 'Mostrar su mesa al invitado' };
function renderToggles() {
  $('#toggles').innerHTML = Object.entries(SECTIONS).map(([k, l]) => `<label class="switch row"><input type="checkbox" data-s="${k}" ${inv.show[k] ? 'checked' : ''}><span></span>${l}</label>`).join('');
}
$('#toggles').addEventListener('change', (e) => {
  const k = e.target.dataset.s;
  if (!k) return;
  inv.show[k] = e.target.checked;
  changed();
});

// ---------- Links ----------
const BASE = new URL('i.html', location.href).href;
let code = '';
async function computeCode() {
  code = await encodeData(inv);
  return code;
}
const linkFor = (g) => BASE + buildHash(code, g);

let shareTimer;
function refreshShare(now = false) {
  clearTimeout(shareTimer);
  shareTimer = setTimeout(updateShare, now ? 0 : 400);
}
async function updateShare() {
  await computeCode();
  const link = linkFor();
  $('#share-link').value = link;
  $('#share-open').href = link;
  const text = `${[inv.ev.pre, inv.ev.names].filter(Boolean).join(' · ')} 💌\n${link}`;
  $('#share-wa').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const kb = (link.length / 1024).toFixed(1);
  $('#link-size').textContent = link.length > 30000
    ? `Link de ${kb} KB: muy largo. Quita fotos subidas y usa links de imagen.`
    : link.length > 2900 ? `Link de ${kb} KB. Funciona en WhatsApp, pero es muy largo para QR (quita fotos subidas para el QR).` : `Link de ${kb} KB. Perfecto 👌`;
  renderGuests();
  if ($('#tab-enviar').classList.contains('on')) renderQR(link);
}

let qrLib;
async function renderQR(link) {
  const box = $('#qr');
  if (link.length > 2900) { box.innerHTML = '<p class="hint">El link es muy largo para un QR.</p>'; return; }
  try {
    qrLib ??= await loadScript('js/vendor/qrcode.js').then(() => window.qrcode);
    const qr = qrLib(0, 'L');
    qr.addData(link);
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  } catch { box.innerHTML = '<p class="hint">No se pudo generar el QR (¿sin internet?).</p>'; }
}
$('#qr-dl').addEventListener('click', () => {
  const svg = $('#qr svg');
  if (!svg) return;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.drawImage(img, 0, 0, 1024, 1024);
    downloadUrl('qr-invitacion.png', c.toDataURL('image/png'));
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
});

$('#copy-link').addEventListener('click', () => copy($('#share-link').value));
$('#share-native').addEventListener('click', async () => {
  const link = $('#share-link').value;
  if (navigator.share) { try { await navigator.share({ title: inv.ev.names, text: '¡Estás invitado! 💌', url: link }); } catch { /* cancelado */ } }
  else copy(link);
});

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado'); }
  catch {
    const t = document.createElement('textarea');
    t.value = text; document.body.appendChild(t); t.select();
    document.execCommand('copy'); t.remove(); toast('Link copiado');
  }
}

// ---------- Invitados (resumen; la gestión completa está en invitados.html) ----------
draft.guests ??= [];
draft.msg ??= DEFAULT_MSG;
$('#open-gestor').href = $('#need-guests-btn').href = `invitados.html?id=${draft.id}`;

function renderGuests() {
  const gs = draft.guests;
  const people = gs.reduce((a, g) => a + (+g.passes || 0), 0);
  const yes = gs.filter((g) => g.status === 'si').reduce((a, g) => a + (+g.confirmed || 0), 0);
  $('#guest-summary').innerHTML = `
    <div class="stat"><b>${gs.length}</b><span>invitaciones</span></div>
    <div class="stat"><b>${people}<small>/${MAX_PEOPLE}</small></b><span>personas</span></div>
    <div class="stat"><b>${yes}</b><span>confirmados</span></div>
    <div class="stat"><b>${gs.filter((g) => !g.status).length}</b><span>pendientes</span></div>`;
  const ok = gs.length >= MIN_GUESTS;
  $('#need-guests').hidden = ok;
  $('#share-zone').classList.toggle('locked', !ok);
  const sel = $('#pv-guest'), cur = sel.value;
  sel.innerHTML = '<option value="">Sin invitado</option>' + gs.map((g) => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
  sel.value = gs.some((g) => g.id === cur) ? cur : '';
}
// Si el gestor cambia invitados en otra pestaña, nos enteramos
window.addEventListener('storage', (e) => {
  if (e.key !== 'convida.invs') return;
  const d = getDraft(draft.id);
  if (d) { draft.guests = d.guests || []; renderGuests(); }
});

// ---------- Campos del RSVP ----------
function renderRsvpFields() {
  const F = inv.rsvp.fields;
  $('#rsvp-fields').innerHTML = Object.entries(RSVP_FIELDS).map(([k, l]) => `<div class="rf">
    <span>${l}</span>
    <div class="seg-sm" data-rf="${k}">${[['off', 'No'], ['opt', 'Opcional'], ['req', 'Obligatorio']].map(([v, t]) => `<button type="button" data-v="${v}" class="${F[k] === v ? 'on' : ''}">${t}</button>`).join('')}</div>
  </div>`).join('') + `<label class="f" ${F.custom === 'off' ? 'hidden' : ''}>Tu pregunta<input id="custom-q" maxlength="80" placeholder="¿Necesitas transporte?" value="${esc(F.customQ || '')}"></label>`;
}
$('#rsvp-fields').addEventListener('click', (e) => {
  const b = e.target.closest('[data-v]');
  const grp = e.target.closest('[data-rf]');
  if (!b || !grp) return;
  inv.rsvp.fields[grp.dataset.rf] = b.dataset.v;
  renderRsvpFields();
  changed();
});
$('#rsvp-fields').addEventListener('input', (e) => {
  if (e.target.id !== 'custom-q') return;
  inv.rsvp.fields.customQ = e.target.value;
  changed();
});

// ---------- Vista previa ----------
const frame = $('#preview');
let previewReady = false;
function pushPreview(extra = {}) {
  if (!previewReady) return;
  const g = draft.guests.find((x) => x.id === $('#pv-guest').value);
  frame.contentWindow.postMessage({ type: 'render', inv, guest: g ? { name: g.name, passes: g.passes, table: tableName(g) } : {}, envelope: $('#pv-envelope').checked && inv.theme.envelope !== false, ...extra }, location.origin);
}
const pushPreviewSoon = debounce(pushPreview, 120);
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  if (e.data?.type === 'preview-ready') { previewReady = true; pushPreview(); }
});
// Por si el iframe cargó antes que este script: le preguntamos si está listo
frame.addEventListener('load', () => frame.contentWindow.postMessage({ type: 'ping' }, location.origin));
try { frame.contentWindow.postMessage({ type: 'ping' }, location.origin); } catch { /* aún no existe */ }
$('#pv-envelope').addEventListener('change', () => pushPreview());
$('#pv-guest').addEventListener('change', () => pushPreview());
$('#device').addEventListener('click', (e) => {
  const b = e.target.closest('[data-d]');
  if (!b) return;
  $$('#device button').forEach((x) => x.classList.toggle('on', x === b));
  $('#device-frame').className = 'device ' + b.dataset.d;
});
$('#open-preview').addEventListener('click', () => document.body.classList.add('show-preview'));
$('#close-preview').addEventListener('click', () => document.body.classList.remove('show-preview'));

$('#png-dl').addEventListener('click', () => {
  if (!previewReady) return;
  toast('Generando imagen…');
  frame.contentWindow.postMessage({ type: 'render', inv, guest: {}, envelope: false }, location.origin);
  const onMsg = (e) => {
    if (e.origin !== location.origin || e.data?.type !== 'png') return;
    window.removeEventListener('message', onMsg);
    pushPreview();
    if (e.data.error) toast('No se pudo generar la imagen. Si usas links de imagen externos, prueba subiendo la foto.');
    else downloadUrl(`invitacion-${slug(inv.ev.names)}.png`, e.data.data);
  };
  window.addEventListener('message', onMsg);
  setTimeout(() => frame.contentWindow.postMessage({ type: 'export-png' }, location.origin), 600);
});

// ---------- Respaldo ----------
$('#inv-export').addEventListener('click', () => download(`invitacion-${slug(inv.ev.names)}.json`, JSON.stringify({ convida: 'invitation', v: 1, inv, guests: draft.guests, tables: draft.tables || [], msg: draft.msg }, null, 2), 'application/json'));
$('#inv-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j.convida !== 'invitation' || !j.inv?.ev) throw new Error();
    const d = { id: uid(), inv: { ...newInvitation(), ...j.inv, theme: sanitizeTheme(j.inv.theme) }, guests: Array.isArray(j.guests) ? j.guests : [], tables: Array.isArray(j.tables) ? j.tables : [], msg: j.msg || DEFAULT_MSG };
    saveDraft(d);
    location.href = `?id=${d.id}`;
  } catch { toast('Ese archivo no es una invitación de Convida'); }
});

// ---------- Utilidades ----------
function tableName(g) { return (draft.tables || []).find((t) => t.id === g.table)?.name || ''; }
function slug(s) { return String(s || 'invitacion').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'invitacion'; }
function downloadUrl(name, url) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function download(name, text, type) { const u = URL.createObjectURL(new Blob([text], { type })); downloadUrl(name, u); setTimeout(() => URL.revokeObjectURL(u), 1000); }
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}

// Para abrir una invitación recibida (#d=...) y editarla como copia
if (location.hash.includes('d=')) {
  const d = new URLSearchParams(location.hash.slice(1)).get('d');
  decodeData(d).then((j) => {
    if (!j?.ev) return;
    inv = draft.inv = { ...newInvitation(), ...j, theme: sanitizeTheme(j.theme) };
    inv.rsvp.fields = { ...defaultRsvpFields(), ...(inv.rsvp?.fields || {}) };
    history.replaceState(null, '', `?id=${draft.id}`);
    changed({ rerenderForm: true });
    toast('Invitación cargada para editar');
  }).catch(() => toast('No se pudo leer ese link'));
}

// ---------- Arranque ----------
renderTemplates();
renderPalettes();
fillForm();
renderGuests();
refreshShare(true);
