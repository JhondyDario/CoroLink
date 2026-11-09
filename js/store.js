// Guarda borradores, invitados y plantillas propias en el navegador (localStorage).
const K_INV = 'corolink.invs';
const K_TPL = 'corolink.tpls';

const read = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export const uid = () => Math.random().toString(36).slice(2, 10);

export function listDrafts() {
  return Object.values(read(K_INV, {})).sort((a, b) => b.updated - a.updated);
}
export function getDraft(id) { return read(K_INV, {})[id] || null; }
export function saveDraft(d) {
  const all = read(K_INV, {});
  d.updated = Date.now();
  all[d.id] = d;
  return write(K_INV, all);
}
export function deleteDraft(id) {
  const all = read(K_INV, {});
  delete all[id];
  write(K_INV, all);
}

export function listMyTemplates() { return read(K_TPL, []); }
export function saveMyTemplate(t) {
  const all = read(K_TPL, []).filter((x) => x.id !== t.id);
  all.unshift(t);
  return write(K_TPL, all);
}
export function deleteMyTemplate(id) { write(K_TPL, read(K_TPL, []).filter((x) => x.id !== id)); }

// Actualiza sólo una parte del borrador, leyendo la versión más nueva primero.
// Así el editor y el gestor de invitados pueden estar abiertos a la vez sin pisarse.
export function updateDraft(id, fn) {
  const all = read(K_INV, {});
  const d = all[id];
  if (!d) return null;
  fn(d);
  d.updated = Date.now();
  all[id] = d;
  return write(K_INV, all) ? d : null;
}

// ---------- Favoritas ----------
const K_FAV = 'corolink.favs';
export const listFavs = () => read(K_FAV, []);
export const isFav = (id) => listFavs().includes(id);
export function toggleFav(id) {
  const favs = listFavs();
  const on = !favs.includes(id);
  write(K_FAV, on ? [id, ...favs] : favs.filter((x) => x !== id));
  return on;
}

// ---------- Duplicar y convertir en plantilla ----------
const clone = (o) => JSON.parse(JSON.stringify(o));

// Copia la invitación (diseño y contenido). Los invitados no se copian:
// casi siempre el otro evento lleva otra lista.
export function duplicateDraft(id) {
  const d = getDraft(id);
  if (!d) return null;
  const copy = { id: uid(), inv: clone(d.inv), guests: [], tables: clone(d.tables || []), msg: d.msg, remind: d.remind };
  copy.inv.ev.names = `${copy.inv.ev.names || 'Invitación'} (copia)`;
  return saveDraft(copy) ? copy : null;
}

// Plantilla propia. Con withContent guarda también textos, lugares, itinerario,
// formulario, etc. (todo menos los invitados) para arrancar invitaciones nuevas.
export function templateFromInvitation(inv, name, withContent) {
  const t = {
    id: 'mi-' + uid(),
    name: String(name || 'Mi plantilla').slice(0, 40),
    type: inv.ev?.type,
    theme: clone(inv.theme),
    ev: { pre: inv.ev?.pre, names: inv.ev?.names, msg: inv.ev?.msg },
  };
  if (withContent) t.inv = clone(inv);
  return saveMyTemplate(t) ? t : null;
}
