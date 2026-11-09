// Guarda borradores, invitados y plantillas propias en el navegador (localStorage).
const K_INV = 'convida.invs';
const K_TPL = 'convida.tpls';

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
