// Gestor de invitados: lista, confirmaciones, sala virtual (mesas) y check-in.
import { encodeData, buildHash } from './codec.js';
import { esc, waPhone, parseDate, fmtDate } from './render.js';
import { MAX_PEOPLE, MIN_GUESTS, EVENT_TYPES } from './templates.js';
import { getDraft, updateDraft, uid, listDrafts } from './store.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const DEFAULT_INVITE = 'Hola {nombre} 💌 Te tenemos una invitación especial. Ábrela aquí:\n{link}';
const DEFAULT_REMIND = 'Hola {nombre} 👋 Te recordamos confirmar tu asistencia. Aquí está tu invitación:\n{link}';

// ---------- Cargar borrador ----------
const id = new URLSearchParams(location.search).get('id') || listDrafts()[0]?.id;
let draft = id && getDraft(id);
if (!draft) {
  document.querySelector('.gmain').innerHTML = `<div class="card center"><h3>No encontramos esa invitación</h3><p class="hint">Crea una primero y luego agrega tus invitados.</p><a class="btn" href="crear.html">Crear invitación</a></div>`;
  throw new Error('sin borrador');
}
let guests = (draft.guests ||= []);
let tables = (draft.tables ||= []);
draft.msg ||= DEFAULT_INVITE;
draft.remind ||= DEFAULT_REMIND;
guests.forEach((g) => { g.status ??= ''; g.group ??= ''; });

$('#ev-name').textContent = [EVENT_TYPES[draft.inv.ev?.type], draft.inv.ev?.names].filter(Boolean).join(' · ');
$('#back-editor').href = `crear.html?id=${draft.id}`;

const save = debounce(() => {
  updateDraft(draft.id, (d) => { d.guests = guests; d.tables = tables; d.msg = draft.msg; d.remind = draft.remind; });
}, 250);
function changed() { save(); renderAll(); }

// Otra pestaña (el editor) cambió la invitación: recalculamos los links
window.addEventListener('storage', (e) => {
  if (e.key !== 'convida.invs') return;
  const d = getDraft(draft.id);
  if (!d) return;
  draft.inv = d.inv;
  computeCode();
});

// ---------- Utilidades ----------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const people = (g) => (g.status === 'no' ? 0 : g.status === 'si' ? +g.confirmed || 0 : +g.passes || 0);
const totalPasses = () => guests.reduce((a, g) => a + (+g.passes || 0), 0);
const tableOf = (g) => tables.find((t) => t.id === g.table);
const tableName = (g) => tableOf(g)?.name || '';
const seated = (t) => guests.filter((g) => g.table === t.id);
const used = (t) => seated(t).reduce((a, g) => a + people(g), 0);
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copiado'); } catch { prompt('Copia el link:', text); }
}

// ---------- Links ----------
const BASE = new URL('i.html', location.href).href;
let code = '';
async function computeCode() { code = await encodeData(draft.inv); renderList(); }
const linkFor = (g) => BASE + buildHash(code, { name: g.name, passes: g.passes, id: g.id, table: tableName(g) });
const fillMsg = (tpl, g) => tpl.replace(/\{nombre\}/g, g.name).replace(/\{pases\}/g, g.passes).replace(/\{mesa\}/g, tableName(g) || 'por asignar').replace(/\{link\}/g, linkFor(g));
const waUrl = (g, tpl) => `https://wa.me/${waPhone(g.phone)}?text=${encodeURIComponent(fillMsg(tpl, g))}`;

// ---------- Pestañas ----------
let currentTab = 'lista';
function openTab(name) {
  currentTab = name;
  $$('.gtabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  $$('.gtab').forEach((t) => t.classList.toggle('on', t.id === 'tab-' + name));
  renderAll();
}
$$('.gtabs [data-tab]').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));

// ---------- Estadísticas ----------
function renderStats() {
  const pass = totalPasses();
  const yes = guests.filter((g) => g.status === 'si');
  const no = guests.filter((g) => g.status === 'no');
  const pend = guests.filter((g) => !g.status);
  const arrived = guests.reduce((a, g) => a + (+g.arrived || 0), 0);
  const pct = Math.min(100, Math.round((pass / MAX_PEOPLE) * 100));
  $('#stats').innerHTML = `
    <div class="st"><b>${guests.length}</b><span>invitaciones</span></div>
    <div class="st wide"><b>${pass}<small> / ${MAX_PEOPLE}</small></b><span>personas invitadas</span><i class="bar"><i style="width:${pct}%"></i></i></div>
    <div class="st ok"><b>${yes.reduce((a, g) => a + (+g.confirmed || 0), 0)}</b><span>confirmados (${yes.length})</span></div>
    <div class="st bad"><b>${no.length}</b><span>no van</span></div>
    <div class="st"><b>${pend.length}</b><span>pendientes</span></div>
    <div class="st"><b>${guests.filter((g) => g.sent).length}</b><span>enviadas</span></div>
    ${currentTab === 'checkin' ? `<div class="st ok"><b>${arrived}</b><span>han llegado</span></div>` : ''}`;
  const left = MAX_PEOPLE - pass;
  $('#limit-msg').textContent = left <= 0 ? `Llegaste al límite de ${MAX_PEOPLE} personas.` : `Te quedan ${left} lugares de ${MAX_PEOPLE}.`;
  $('#limit-msg').classList.toggle('full', left <= 0);
  if (guests.length < MIN_GUESTS) $('#limit-msg').textContent += ` Necesitas al menos ${MIN_GUESTS} invitado para enviar.`;
}

// ---------- Lista ----------
function addGuest({ name, passes, phone, group }) {
  name = String(name || '').trim().slice(0, 80);
  passes = Math.min(20, Math.max(1, parseInt(passes, 10) || 1));
  if (!name) return 'sin nombre';
  if (totalPasses() + passes > MAX_PEOPLE) return 'limite';
  guests.push({ id: uid(), name, passes, phone: String(phone || '').trim().slice(0, 20), group: String(group || '').trim().slice(0, 40), status: '', confirmed: 0, sent: false, arrived: 0, note: '', answers: {} });
  return 'ok';
}
$('#add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const r = addGuest({ name: f.name.value, passes: f.passes.value, phone: f.phone.value, group: f.group.value });
  if (r === 'limite') return toast(`No caben: el límite es de ${MAX_PEOPLE} personas en total.`);
  f.name.value = ''; f.phone.value = '';
  f.name.focus();
  changed();
});
$('#bulk-add').addEventListener('click', () => {
  const lines = $('#bulk').value.split('\n').map((l) => l.trim()).filter(Boolean);
  let ok = 0, full = 0;
  for (const l of lines) {
    const [name, passes, phone, group] = l.split(/[,;\t]/).map((x) => x.trim());
    const r = addGuest({ name, passes, phone, group });
    if (r === 'ok') ok++; else if (r === 'limite') full++;
  }
  $('#bulk').value = full ? lines.slice(ok).join('\n') : '';
  toast(full ? `${ok} agregados. ${full} no cupieron por el límite de ${MAX_PEOPLE}.` : `${ok} invitados agregados`);
  changed();
});
$('#msg-invite').value = draft.msg;
$('#msg-remind').value = draft.remind;
$('#msg-invite').addEventListener('input', (e) => { draft.msg = e.target.value; save(); renderList(); });
$('#msg-remind').addEventListener('input', (e) => { draft.remind = e.target.value; save(); renderList(); });
['#q', '#f-status', '#f-group'].forEach((s) => $(s).addEventListener('input', () => renderList()));

const STATUS = { '': ['Pendiente', 'pend'], si: ['Confirmado', 'ok'], no: ['No va', 'bad'] };
let openRow = null;

function filtered() {
  const q = norm($('#q').value), st = $('#f-status').value, gr = $('#f-group').value;
  return guests.filter((g) => {
    if (q && !norm(g.name).includes(q) && !norm(g.phone).includes(q)) return false;
    if (gr && g.group !== gr) return false;
    if (st === 'pend') return !g.status;
    if (st === 'si' || st === 'no') return g.status === st;
    if (st === 'unsent') return !g.sent;
    if (st === 'notable') return !g.table && g.status !== 'no';
    return true;
  });
}

function renderList() {
  const groups = [...new Set(guests.map((g) => g.group).filter(Boolean))].sort();
  $('#groups').innerHTML = groups.map((g) => `<option value="${esc(g)}">`).join('');
  const fg = $('#f-group'), cur = fg.value;
  fg.innerHTML = '<option value="">Todos los grupos</option>' + groups.map((g) => `<option>${esc(g)}</option>`).join('');
  fg.value = groups.includes(cur) ? cur : '';
  const list = filtered();
  $('#empty-list').hidden = guests.length > 0;
  $('#glist').innerHTML = list.map((g) => {
    const [label, cls] = STATUS[g.status] || STATUS[''];
    const t = tableName(g);
    const open = openRow === g.id;
    return `<li class="${open ? 'open' : ''}" data-g="${g.id}">
      <div class="g-row">
        <button class="g-main" type="button" data-toggle aria-expanded="${open}">
          <b>${esc(g.name)}</b>
          <small>${g.passes} pase(s)${g.group ? ' · ' + esc(g.group) : ''}${t ? ' · 🪑 ' + esc(t) : ''}${g.sent ? ' · enviada' : ''}</small>
        </button>
        <span class="pill ${cls}">${label}${g.status === 'si' ? ' · ' + g.confirmed : ''}</span>
        <div class="g-actions">
          ${!g.status && g.sent
            ? `<a class="btn sm ghost" target="_blank" rel="noopener" href="${esc(waUrl(g, draft.remind))}" data-remind>Recordar</a>`
            : `<a class="btn sm wa" target="_blank" rel="noopener" href="${esc(waUrl(g, draft.msg))}" data-send>WhatsApp</a>`}
          <button class="btn ghost sm" type="button" data-copy>Link</button>
        </div>
      </div>
      ${open ? editForm(g) : ''}
    </li>`;
  }).join('');
}

function editForm(g) {
  const a = g.answers || {};
  const ans = [['companions', 'Acompañantes'], ['phone', 'Teléfono'], ['diet', 'Comida'], ['song', 'Canción'], ['custom', 'Respuesta'], ['msg', 'Mensaje']]
    .filter(([k]) => a[k]).map(([k, l]) => `<p><b>${l}:</b> ${esc(a[k])}</p>`).join('');
  return `<div class="g-edit">
    <div class="row2">
      <label class="f">Nombre<input data-e="name" maxlength="80" value="${esc(g.name)}"></label>
      <label class="f">Pases<input data-e="passes" type="number" min="1" max="20" value="${g.passes}"></label>
    </div>
    <div class="row2">
      <label class="f">WhatsApp<input data-e="phone" type="tel" maxlength="20" value="${esc(g.phone)}"></label>
      <label class="f">Grupo<input data-e="group" list="groups" maxlength="40" value="${esc(g.group)}"></label>
    </div>
    <div class="row2">
      <label class="f">Estado<select data-e="status">
        <option value="" ${!g.status ? 'selected' : ''}>Pendiente</option>
        <option value="si" ${g.status === 'si' ? 'selected' : ''}>Confirmado</option>
        <option value="no" ${g.status === 'no' ? 'selected' : ''}>No va</option>
      </select></label>
      <label class="f">Personas que van<input data-e="confirmed" type="number" min="0" max="${g.passes}" value="${g.confirmed || 0}" ${g.status === 'si' ? '' : 'disabled'}></label>
    </div>
    <label class="f">Mesa<select data-e="table"><option value="">Sin mesa</option>${tables.filter((t) => t.kind !== 'zone').map((t) => `<option value="${t.id}" ${g.table === t.id ? 'selected' : ''}>${esc(t.name)} (${used(t)}/${t.seats})</option>`).join('')}</select></label>
    <label class="f">Nota privada<input data-e="note" maxlength="200" value="${esc(g.note || '')}"></label>
    ${ans ? `<div class="answers-mini">${ans}</div>` : ''}
    <div class="btn-row"><label class="switch sm"><input type="checkbox" data-e="sent" ${g.sent ? 'checked' : ''}><span></span>Enviada</label>
    <button class="btn ghost sm danger" type="button" data-del>Eliminar</button></div>
  </div>`;
}

$('#glist').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-g]');
  if (!li) return;
  const g = guests.find((x) => x.id === li.dataset.g);
  if (e.target.closest('[data-toggle]')) { openRow = openRow === g.id ? null : g.id; renderList(); return; }
  if (e.target.closest('[data-send]') || e.target.closest('[data-remind]')) {
    if (e.target.closest('[data-remind]')) g.reminded = (g.reminded || 0) + 1;
    g.sent = true; save(); setTimeout(renderAll, 300); return;
  }
  if (e.target.closest('[data-copy]')) { copy(linkFor(g)); g.sent = true; changed(); return; }
  if (e.target.closest('[data-del]') && confirm(`¿Eliminar a ${g.name}?`)) { guests.splice(guests.indexOf(g), 1); openRow = null; changed(); }
});
$('#glist').addEventListener('change', (e) => {
  const el = e.target.closest('[data-e]');
  if (!el) return;
  const g = guests.find((x) => x.id === el.closest('li').dataset.g);
  const k = el.dataset.e;
  if (k === 'sent') g.sent = el.checked;
  else if (k === 'passes') {
    const others = totalPasses() - g.passes;
    let v = Math.min(20, Math.max(1, parseInt(el.value, 10) || 1));
    if (others + v > MAX_PEOPLE) { v = Math.max(1, MAX_PEOPLE - others); toast(`Ajustado a ${v}: el límite es de ${MAX_PEOPLE} personas.`); }
    g.passes = v;
    g.confirmed = Math.min(g.confirmed || 0, v);
  } else if (k === 'confirmed') g.confirmed = Math.min(g.passes, Math.max(0, parseInt(el.value, 10) || 0));
  else if (k === 'status') { g.status = el.value; if (g.status === 'si' && !g.confirmed) g.confirmed = g.passes; if (g.status !== 'si') g.confirmed = 0; }
  else if (k === 'name') g.name = el.value.trim().slice(0, 80) || g.name;
  else g[k] = el.value.trim();
  changed();
});
$('#remind-all').addEventListener('click', () => {
  $('#f-status').value = 'pend';
  renderList();
  const n = guests.filter((g) => !g.status && g.sent).length;
  toast(n ? `${n} pendientes. Toca "Recordar" en cada uno.` : 'No hay pendientes a quienes ya les enviaste.');
});
$('#csv').addEventListener('click', () => {
  const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const head = ['Nombre', 'Grupo', 'Pases', 'Teléfono', 'Estado', 'Van', 'Mesa', 'Llegaron', 'Acompañantes', 'Comida', 'Canción', 'Respuesta', 'Mensaje', 'Nota', 'Enviada', 'Link'];
  const rows = guests.map((g) => [g.name, g.group, g.passes, g.phone, STATUS[g.status]?.[0], g.confirmed || 0, tableName(g), g.arrived || 0,
    g.answers?.companions, g.answers?.diet, g.answers?.song, g.answers?.custom, g.answers?.msg, g.note, g.sent ? 'sí' : 'no', linkFor(g)]);
  download('invitados.csv', '\ufeff' + [head, ...rows].map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
});

// ---------- Confirmaciones ----------
// Lee los mensajes que generó el formulario: "Soy *Nombre* ... CV|id|si|3"
export function parseConfirmations(text) {
  const out = [];
  const re = /Soy \*([^*\n]{1,80})\*([\s\S]*?)CV\|([a-z0-9]{1,12})\|(si|no)\|(\d{1,3})/gi;
  let m;
  while ((m = re.exec(text))) {
    const body = m[2];
    const pick = (label) => (new RegExp(label + '\\s*(.+)').exec(body) || [])[1]?.trim() || '';
    out.push({
      name: m[1].trim(), gid: m[3], go: m[4].toLowerCase(), n: parseInt(m[5], 10) || 0,
      answers: { companions: pick('Acompañantes:'), phone: pick('Teléfono:'), diet: pick('Comida:'), song: pick('Canción:'), custom: (/❓ [^:\n]+:\s*(.+)/.exec(body) || [])[1] || '', msg: (/💬 (.+)/.exec(body) || [])[1] || '' },
    });
  }
  return out;
}

function applyConfirmations(text) {
  const items = parseConfirmations(text);
  if (!items.length) { $('#report').innerHTML = `<div class="notice"><b>No encontramos confirmaciones.</b><p>Asegúrate de pegar los mensajes completos, con la línea que empieza con CV|.</p></div>`; return; }
  const done = [], unknown = [];
  for (const it of items) {
    let g = it.gid !== '0' && guests.find((x) => x.id === it.gid);
    if (!g) g = guests.find((x) => norm(x.name) === norm(it.name));
    if (!g) { unknown.push(it); continue; }
    g.status = it.go;
    g.confirmed = it.go === 'si' ? Math.min(g.passes, Math.max(1, it.n || g.passes)) : 0;
    g.answers = Object.fromEntries(Object.entries(it.answers).filter(([, v]) => v));
    g.sent = true;
    done.push(g);
  }
  pendingUnknown = unknown;
  $('#report').innerHTML = `<div class="notice ok-n"><b>${done.length} confirmación(es) actualizada(s).</b>
    ${done.length ? `<p>${done.map((g) => `${esc(g.name)}: ${g.status === 'si' ? `✅ ${g.confirmed}` : '❌ no va'}`).join(' · ')}</p>` : ''}</div>
    ${unknown.length ? `<div class="notice"><b>${unknown.length} persona(s) confirmaron con el link general y no están en tu lista:</b>
      <ul class="unk">${unknown.map((u, i) => `<li>${esc(u.name)} · ${u.go === 'si' ? `✅ ${u.n}` : '❌'} <button class="btn sm" type="button" data-addunk="${i}">Agregar</button></li>`).join('')}</ul></div>` : ''}`;
  changed();
}
let pendingUnknown = [];
$('#report').addEventListener('click', (e) => {
  const b = e.target.closest('[data-addunk]');
  if (!b) return;
  const u = pendingUnknown[+b.dataset.addunk];
  const r = addGuest({ name: u.name, passes: Math.max(1, u.n), phone: u.answers.phone, group: 'Link general' });
  if (r === 'limite') return toast(`No cabe: el límite es de ${MAX_PEOPLE} personas.`);
  const g = guests.at(-1);
  Object.assign(g, { status: u.go, confirmed: u.go === 'si' ? Math.max(1, u.n) : 0, sent: true, answers: u.answers });
  b.replaceWith('agregado ✓');
  changed();
});
$('#process').addEventListener('click', () => { applyConfirmations($('#paste').value); $('#paste').value = ''; });
$('#chat-file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) applyConfirmations(await f.text());
});

function renderAnswers() {
  const yes = guests.filter((g) => g.status === 'si');
  const list = (k, l) => {
    const xs = yes.filter((g) => g.answers?.[k]);
    return xs.length ? `<div class="card"><h4>${l}</h4><ul>${xs.map((g) => `<li><b>${esc(g.name)}:</b> ${esc(g.answers[k])}</li>`).join('')}</ul></div>` : '';
  };
  const html = list('diet', '🍽️ Comida y alergias') + list('song', '🎵 Canciones pedidas') + list('companions', '👫 Acompañantes') + list('custom', '❓ Tu pregunta') + list('msg', '💬 Mensajes');
  $('#answers').innerHTML = html || '<p class="hint">Aquí verás las respuestas (comida, canciones, mensajes…) cuando cargues confirmaciones.</p>';
}

// ---------- Sala virtual ----------
const W = 1000, H = 700;
let selTable = null;

function geom(t) {
  if (t.kind === 'zone') return { w: t.w || 220, h: t.h || 120 };
  if (t.kind === 'rect') { const side = Math.ceil(t.seats / 2); return { w: 50 + side * 30, h: 54 }; }
  const r = 30 + t.seats * 2.4;
  return { w: r * 2, h: r * 2, r };
}
function seatPos(t) {
  const g = geom(t);
  if (t.kind === 'rect') {
    const top = Math.ceil(t.seats / 2), bot = t.seats - top, pts = [];
    for (let i = 0; i < top; i++) pts.push([-g.w / 2 + 25 + 15 + i * 30, -g.h / 2 - 14]);
    for (let i = 0; i < bot; i++) pts.push([-g.w / 2 + 25 + 15 + i * 30, g.h / 2 + 14]);
    return pts;
  }
  return [...Array(t.seats)].map((_, i) => { const a = (i / t.seats) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * (g.r + 15), Math.sin(a) * (g.r + 15)]; });
}

function roomSVG({ live = false, highlight = null } = {}) {
  const els = tables.map((t) => {
    const g = geom(t);
    const sel = !live && selTable === t.id ? ' sel' : '';
    const hi = highlight === t.id ? ' hi' : '';
    if (t.kind === 'zone') {
      return `<g class="tbl zone${sel}" data-id="${t.id}" transform="translate(${t.x} ${t.y})">
        <rect x="${-g.w / 2}" y="${-g.h / 2}" width="${g.w}" height="${g.h}" rx="10"/>
        <text y="6">${esc(t.name)}</text></g>`;
    }
    // Cada asiento: libre, asignado o ya llegó
    const states = [];
    for (const gg of seated(t)) {
      const n = people(gg), arr = Math.min(n, +gg.arrived || 0);
      for (let i = 0; i < n; i++) states.push(i < arr ? 'arr' : 'asg');
    }
    const seats = seatPos(t).map(([x, y], i) => `<circle class="seat ${states[i] || 'free'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`).join('');
    const over = states.length > t.seats ? ' over' : '';
    const shape = t.kind === 'rect'
      ? `<rect class="top" x="${-g.w / 2}" y="${-g.h / 2}" width="${g.w}" height="${g.h}" rx="8"/>`
      : `<circle class="top" r="${g.r}"/>`;
    const arrived = states.filter((s) => s === 'arr').length;
    return `<g class="tbl${sel}${hi}${over}" data-id="${t.id}" transform="translate(${t.x} ${t.y})">${seats}${shape}
      <text y="-2">${esc(t.name)}</text><text class="cnt" y="16">${live ? `${arrived}/${states.length}` : `${states.length}/${t.seats}`}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="room-svg" role="img" aria-label="Plano del salón">
    <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" class="gridline"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#grid)" class="floor"/>${els}
    ${tables.length ? '' : `<text x="${W / 2}" y="${H / 2}" class="hint-svg">Agrega mesas con los botones de arriba</text>`}</svg>`;
}

// Busca un espacio libre donde quepa la mesa sin chocar con otras (ni con sus sillas)
function freeSpot(t) {
  const g = geom(t), pad = 46;
  const m = t.kind === 'zone' ? 16 : 34; // margen para las sillas
  for (let y = g.h / 2 + m; y <= H - g.h / 2 - m; y += 20) {
    for (let x = g.w / 2 + m; x <= W - g.w / 2 - m; x += 20) {
      const hit = tables.some((o) => {
        const og = geom(o);
        return Math.abs(o.x - x) < (og.w + g.w) / 2 + pad && Math.abs(o.y - y) < (og.h + g.h) / 2 + pad;
      });
      if (!hit) return [x, y];
    }
  }
  return [W / 2, H / 2];
}
function newTable(kind, seats) {
  const n = tables.filter((t) => t.kind !== 'zone').length + 1;
  const t = kind === 'zone'
    ? { id: uid(), kind, name: 'Pista', w: 220, h: 120 }
    : { id: uid(), kind, name: `Mesa ${n}`, seats: seats || (kind === 'rect' ? 10 : 8) };
  [t.x, t.y] = freeSpot(t);
  tables.push(t);
  selTable = t.id;
  return t;
}
$$('[data-new]').forEach((b) => b.addEventListener('click', () => { newTable(b.dataset.new); changed(); }));

// Sentar automáticamente: mantiene juntos a los del mismo grupo
$('#auto-seat').addEventListener('click', () => {
  const todo = guests.filter((g) => !g.table && g.status !== 'no' && people(g) > 0)
    .sort((a, b) => (a.group || '~').localeCompare(b.group || '~') || people(b) - people(a));
  if (!todo.length) return toast('Todos tienen mesa 👌');
  let made = 0;
  for (const g of todo) {
    const n = people(g);
    const fits = tables.filter((t) => t.kind !== 'zone' && t.seats - used(t) >= n);
    let t = fits.find((x) => seated(x).some((o) => o.group && o.group === g.group)) || fits.find((x) => used(x) === 0 && g.group) || fits[0];
    if (!t) { t = newTable('round', Math.max(8, Math.min(20, n))); made++; }
    g.table = t.id;
  }
  selTable = null;
  toast(`Listo: ${todo.length} invitado(s) sentados${made ? `, ${made} mesa(s) nueva(s)` : ''}.`);
  changed();
});

function renderRoom() {
  $('#room').innerHTML = roomSVG();
  renderTablePanel();
}

// Arrastrar mesas (funciona con mouse y con el dedo)
let drag = null;
$('#room').addEventListener('pointerdown', (e) => {
  const gEl = e.target.closest('.tbl');
  if (!gEl) { if (selTable) { selTable = null; renderRoom(); } return; }
  const svg = $('#room svg');
  const t = tables.find((x) => x.id === gEl.dataset.id);
  const pt = toSvg(svg, e);
  drag = { t, gEl, svg, dx: pt.x - t.x, dy: pt.y - t.y, moved: false, sx: e.clientX, sy: e.clientY };
  gEl.setPointerCapture(e.pointerId);
  e.preventDefault();
});
$('#room').addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
  drag.moved = true;
  const pt = toSvg(drag.svg, e), g = geom(drag.t);
  drag.t.x = Math.round(Math.min(W - g.w / 2, Math.max(g.w / 2, pt.x - drag.dx)));
  drag.t.y = Math.round(Math.min(H - g.h / 2, Math.max(g.h / 2, pt.y - drag.dy)));
  drag.gEl.setAttribute('transform', `translate(${drag.t.x} ${drag.t.y})`);
});
const endDrag = () => {
  if (!drag) return;
  const { t, moved } = drag;
  drag = null;
  if (!moved) selTable = t.id;
  save();
  renderRoom();
};
$('#room').addEventListener('pointerup', endDrag);
$('#room').addEventListener('pointercancel', endDrag);
function toSvg(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

function renderTablePanel() {
  const t = tables.find((x) => x.id === selTable);
  const unseated = guests.filter((g) => !g.table && g.status !== 'no');
  if (!t) {
    const real = tables.filter((x) => x.kind !== 'zone');
    const seats = real.reduce((a, x) => a + x.seats, 0);
    const need = guests.reduce((a, g) => a + people(g), 0);
    $('#table-panel').innerHTML = `<div class="card">
      <h3>Salón</h3>
      <p class="hint">${real.length} mesas · ${seats} sillas · ${need} personas esperadas${seats < need ? ` · <b class="warn">faltan ${need - seats} sillas</b>` : ''}</p>
      <p class="hint">Toca una mesa para editarla o arrástrala para moverla.</p></div>
      <div class="card"><h3>Sin mesa (${unseated.length})</h3>
      ${unseated.length ? `<ul class="plain">${unseated.map((g) => `<li><span>${esc(g.name)} <small>${people(g)}</small></span>
        <select data-seat="${g.id}" aria-label="Mesa para ${esc(g.name)}"><option value="">Mesa…</option>${real.map((x) => `<option value="${x.id}" ${x.seats - used(x) < people(g) ? 'disabled' : ''}>${esc(x.name)} (${x.seats - used(x)} libres)</option>`).join('')}</select></li>`).join('')}</ul>` : '<p class="hint">Todos tienen mesa 👌</p>'}</div>`;
    return;
  }
  if (t.kind === 'zone') {
    $('#table-panel').innerHTML = `<div class="card"><h3>Zona</h3>
      <label class="f">Nombre<input data-t="name" maxlength="30" value="${esc(t.name)}"></label>
      <div class="row2"><label class="f">Ancho<input data-t="w" type="number" min="60" max="600" step="10" value="${t.w}"></label>
      <label class="f">Alto<input data-t="h" type="number" min="40" max="400" step="10" value="${t.h}"></label></div>
      <div class="btn-row"><button class="btn ghost sm" data-tclose type="button">Listo</button><button class="btn ghost sm danger" data-tdel type="button">Eliminar</button></div></div>`;
    return;
  }
  const here = seated(t);
  const free = t.seats - used(t);
  $('#table-panel').innerHTML = `<div class="card"><h3>${esc(t.name)}</h3>
    <label class="f">Nombre<input data-t="name" maxlength="30" value="${esc(t.name)}"></label>
    <div class="row2">
      <label class="f">Sillas<input data-t="seats" type="number" min="1" max="20" value="${t.seats}"></label>
      <label class="f">Forma<select data-t="kind"><option value="round" ${t.kind === 'round' ? 'selected' : ''}>Redonda</option><option value="rect" ${t.kind === 'rect' ? 'selected' : ''}>Larga</option></select></label>
    </div>
    <p class="hint">${used(t)} de ${t.seats} sillas ocupadas${free < 0 ? ` · <b class="warn">sobran ${-free} personas</b>` : ''}</p>
    <ul class="plain">${here.map((g) => `<li><span>${esc(g.name)} <small>${people(g)}${g.status === 'si' ? ' ✅' : g.status === 'no' ? ' ❌' : ''}</small></span><button class="btn ghost sm" data-unseat="${g.id}" type="button">Quitar</button></li>`).join('') || '<li class="hint">Nadie todavía</li>'}</ul>
    ${unseated.length ? `<label class="f">Sentar aquí<select data-seat-here><option value="">Escoge un invitado…</option>${unseated.map((g) => `<option value="${g.id}" ${people(g) > free ? 'disabled' : ''}>${esc(g.name)} (${people(g)})</option>`).join('')}</select></label>` : ''}
    <div class="btn-row"><button class="btn ghost sm" data-tclose type="button">Listo</button><button class="btn ghost sm danger" data-tdel type="button">Eliminar mesa</button></div></div>`;
}
$('#table-panel').addEventListener('change', (e) => {
  const t = tables.find((x) => x.id === selTable);
  const el = e.target;
  if (el.dataset.seat !== undefined) { const g = guests.find((x) => x.id === el.dataset.seat); if (g && el.value) { g.table = el.value; changed(); } return; }
  if (el.dataset.seatHere !== undefined) { const g = guests.find((x) => x.id === el.value); if (g) { g.table = t.id; changed(); } return; }
  if (!t || !el.dataset.t) return;
  const k = el.dataset.t;
  if (k === 'seats') t.seats = Math.min(20, Math.max(1, parseInt(el.value, 10) || 1));
  else if (k === 'w' || k === 'h') t[k] = Math.min(k === 'w' ? 600 : 400, Math.max(40, parseInt(el.value, 10) || 100));
  else if (k === 'name') t.name = el.value.trim().slice(0, 30) || t.name;
  else t[k] = el.value;
  changed();
});
$('#table-panel').addEventListener('click', (e) => {
  if (e.target.closest('[data-tclose]')) { selTable = null; renderRoom(); return; }
  const un = e.target.closest('[data-unseat]');
  if (un) { guests.find((g) => g.id === un.dataset.unseat).table = ''; changed(); return; }
  if (e.target.closest('[data-tdel]')) {
    const t = tables.find((x) => x.id === selTable);
    if (!confirm(`¿Eliminar ${t.name}? Sus invitados quedan sin mesa.`)) return;
    guests.forEach((g) => { if (g.table === t.id) g.table = ''; });
    tables.splice(tables.indexOf(t), 1);
    selTable = null;
    changed();
  }
});

// ---------- Check-in ----------
let lastArrival = null;
function renderCheckin() {
  $('#room-live').innerHTML = roomSVG({ live: true, highlight: lastArrival?.table });
  const q = norm($('#cq').value);
  const list = guests.filter((g) => g.status !== 'no' && (!q || norm(g.name).includes(q)))
    .sort((a, b) => (people(a) - (+a.arrived || 0) > 0 ? 0 : 1) - (people(b) - (+b.arrived || 0) > 0 ? 0 : 1) || a.name.localeCompare(b.name));
  $('#clist').innerHTML = list.map((g) => {
    const n = people(g) || g.passes, arr = +g.arrived || 0;
    return `<li class="${arr >= n ? 'in' : ''}" data-g="${g.id}">
      <div class="g-main"><b>${esc(g.name)}</b><small>${tableName(g) ? '🪑 ' + esc(tableName(g)) : 'Sin mesa'} · ${arr}/${n}</small></div>
      <div class="g-actions">
        ${arr > 0 ? `<button class="btn ghost sm" data-arr="-1" type="button" aria-label="Quitar uno">−</button>` : ''}
        ${arr < n ? `<button class="btn ghost sm" data-arr="1" type="button" aria-label="Llegó uno">+1</button><button class="btn sm ok-b" data-arr="all" type="button">Llegaron</button>` : '<span class="pill ok">✓ Llegó</span>'}
      </div></li>`;
  }).join('') || '<li class="hint">No hay invitados que coincidan.</li>';
}
$('#cq').addEventListener('input', renderCheckin);
$('#clist').addEventListener('click', (e) => {
  const b = e.target.closest('[data-arr]');
  if (!b) return;
  const g = guests.find((x) => x.id === b.closest('li').dataset.g);
  const n = people(g) || g.passes;
  const before = +g.arrived || 0;
  g.arrived = b.dataset.arr === 'all' ? n : Math.min(n, Math.max(0, before + +b.dataset.arr));
  if (g.arrived > before) {
    lastArrival = g;
    const t = tableName(g);
    $('#welcome').innerHTML = `<span>¡Bienvenidos!</span><b>${esc(g.name)}</b>${t ? `<em>${esc(t)}</em>` : ''}`;
    $('#welcome').classList.remove('pop');
    void $('#welcome').offsetWidth;
    $('#welcome').classList.add('pop');
  }
  $('#cq').value = '';
  changed();
});
$('#fullscreen').addEventListener('click', () => {
  const el = $('#tab-checkin .room-cols > div');
  (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
});

// ---------- Render general ----------
function renderAll() {
  renderStats();
  if (currentTab === 'lista') renderList();
  if (currentTab === 'respuestas') renderAnswers();
  if (currentTab === 'sala') renderRoom();
  if (currentTab === 'checkin') renderCheckin();
}

const d = parseDate(draft.inv.ev?.date, draft.inv.ev?.time);
if (d) $('#ev-name').title = fmtDate(d);
renderAll();
computeCode();
