// Imágenes y música libres (Creative Commons) vía Openverse, y reproductor de Spotify.
// Openverse es el buscador de contenido abierto de WordPress: no pide llave y permite uso desde el navegador.
// Toda imagen o canción de aquí lleva su crédito (autor + licencia), como piden las licencias CC.

const API = 'https://api.openverse.org/v1';

// Búsqueda sugerida según el tipo de evento (en inglés: hay muchos más resultados)
export const EVENT_QUERY = {
  boda: 'wedding flowers', aniversario: 'couple romantic', despedida: 'party night city', xv: 'pink flowers celebration',
  cumple: 'birthday party balloons', baby: 'baby shower', bautizo: 'church white flowers', graduacion: 'graduation cap',
  bienvenida: 'welcome home party', reencuentro: 'friends celebration', cena: 'family dinner table',
  torneo: 'gaming setup neon', lan: 'computer gaming', juego: 'video game controller', stream: 'esports arena', rol: 'dice board game',
  fiesta: 'party lights', halloween: 'halloween pumpkins', anonuevo: 'fireworks night', bbq: 'barbecue grill', pool: 'swimming pool summer',
  openhouse: 'house interior', corporativo: 'office conference', producto: 'technology launch', taller: 'workshop laptop',
  conferencia: 'conference stage', meetup: 'people meetup', benefico: 'volunteers community',
};
export const EVENT_MUSIC = {
  boda: 'romantic piano', aniversario: 'romantic', xv: 'waltz', cumple: 'happy upbeat', baby: 'lullaby', bautizo: 'calm piano',
  torneo: 'electronic epic', lan: 'chiptune', juego: 'chiptune', stream: 'electronic', rol: 'medieval fantasy', halloween: 'spooky',
  anonuevo: 'party dance', bbq: 'latin guitar', pool: 'tropical summer', corporativo: 'corporate', producto: 'corporate upbeat',
};

const LIC = (r) => `CC ${String(r.license || '').toUpperCase()}${r.license_version ? ' ' + r.license_version : ''}`.replace('CC CC0', 'CC0').replace('CC PDM', 'Dominio público');

async function get(path, params) {
  const q = new URLSearchParams(params);
  const r = await fetch(`${API}${path}?${q}`, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(r.status === 429 ? 'limite' : 'red');
  return r.json();
}

// Imágenes: { id, thumb, url, w, h, credit: { id, by, lic, kind } }
export async function searchImages(query, { page = 1, wide = false } = {}) {
  const params = { q: query, page, page_size: 20, license_type: 'commercial,modification', mature: 'false' };
  if (wide) params.aspect_ratio = 'wide';
  const j = await get('/images/', params);
  return (j.results || []).filter((r) => r.url && /^https:\/\//.test(r.url)).map((r) => ({
    id: r.id,
    thumb: r.thumbnail || r.url,
    url: r.url,
    w: r.width, h: r.height,
    title: r.title || '',
    credit: { id: r.id, by: String(r.creator || 'Autor desconocido').slice(0, 60), lic: LIC(r), kind: 'image' },
  }));
}

// Música: { id, url, title, by, secs, credit }
export async function searchAudio(query, { page = 1 } = {}) {
  const j = await get('/audio/', { q: query, page, page_size: 20, license_type: 'commercial', mature: 'false' });
  return (j.results || []).filter((r) => r.url && /^https:\/\//.test(r.url) && (!r.filetype || /mp3|ogg|wav|m4a/i.test(r.filetype))).map((r) => ({
    id: r.id,
    url: r.url,
    title: String(r.title || 'Sin título').slice(0, 80),
    by: String(r.creator || '').slice(0, 60),
    secs: r.duration ? Math.round(r.duration / 1000) : 0,
    credit: { id: r.id, by: String(r.creator || 'Autor desconocido').slice(0, 60), lic: LIC(r), kind: 'audio', title: String(r.title || '').slice(0, 60) },
  }));
}

// Página del crédito en Openverse (corta, para no alargar el link de la invitación)
export const creditLink = (c) => `https://openverse.org/${c.kind === 'audio' ? 'audio' : 'image'}/${encodeURIComponent(c.id)}`;

// ---------- Spotify ----------
// Acepta links como https://open.spotify.com/playlist/ID?si=... o spotify:playlist:ID
export function spotifyEmbed(link) {
  const s = String(link || '').trim();
  const m = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]{10,40})/.exec(s)
    || /^spotify:(playlist|album|track|artist|episode|show):([A-Za-z0-9]{10,40})$/.exec(s);
  if (!m) return null;
  return { type: m[1], id: m[2], src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator`, height: m[1] === 'track' || m[1] === 'episode' ? 152 : 352 };
}
