// Codifica la invitación completa dentro del link (#d=...).
// JSON -> deflate-raw (CompressionStream nativo) -> base64url.
// Nada se guarda en servidores: el link ES la invitación.

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

const canCompress = typeof CompressionStream !== 'undefined';

// Prefijo "z" = comprimido, "j" = JSON plano (navegadores viejos)
export async function encodeData(obj) {
  const raw = enc.encode(JSON.stringify(obj));
  if (canCompress) {
    try {
      return 'z' + toB64url(await pipe(raw, new CompressionStream('deflate-raw')));
    } catch (_) { /* cae al plano */ }
  }
  return 'j' + toB64url(raw);
}

export async function decodeData(str) {
  if (!str) return null;
  const kind = str[0];
  const bytes = fromB64url(str.slice(1));
  if (kind === 'z') {
    return JSON.parse(dec.decode(await pipe(bytes, new DecompressionStream('deflate-raw'))));
  }
  if (kind === 'j') return JSON.parse(dec.decode(bytes));
  throw new Error('Formato de link desconocido');
}

// Lee #d=...&to=...&p=... del hash
export function parseHash(hash = location.hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    d: p.get('d'),
    to: p.get('to') || '',
    passes: parseInt(p.get('p') || '0', 10) || 0,
    gid: (p.get('g') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12),
    table: (p.get('m') || '').slice(0, 40),
  };
}

export function buildHash(code, guest) {
  const p = new URLSearchParams();
  p.set('d', code);
  if (guest && guest.name) p.set('to', guest.name);
  if (guest && guest.passes) p.set('p', String(guest.passes));
  if (guest && guest.id) p.set('g', guest.id);
  if (guest && guest.table) p.set('m', guest.table);
  return '#' + p.toString();
}
