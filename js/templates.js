// Catálogo: fuentes, decoraciones SVG, plantillas base y datos por defecto.
import { ti } from './i18n.js';
import { TEMPLATES_EN } from './templates.en.js';

export const FONTS = {
  'Great Vibes': 'cursiva',
  'Parisienne': 'cursiva',
  'Dancing Script': 'cursiva',
  'Pacifico': 'divertida',
  'Playfair Display': 'serif',
  'Cormorant Garamond': 'serif',
  'Cinzel': 'serif',
  'Lora': 'serif',
  'Montserrat': 'sans',
  'Poppins': 'sans',
  'Quicksand': 'sans',
  'Josefin Sans': 'sans',
  'Baloo 2': 'divertida',
  'Press Start 2P': 'pixel',
  'Orbitron': 'tech',
  'Rajdhani': 'tech',
  'Bebas Neue': 'impacto',
  'Creepster': 'terror',
  'MedievalSharp': 'fantasía',
};

// Algunas letras son mucho más anchas o más bajitas: ajustamos el tamaño del título
export const FONT_SCALE = { 'Press Start 2P': 0.5, 'Orbitron': 0.72, 'Cinzel': 0.85, 'Bebas Neue': 1.15, 'Montserrat': 0.85, 'Poppins': 0.85, 'Rajdhani': 1, 'Creepster': 1 };

export function fontsHref(families) {
  const uniq = [...new Set(families.filter((f) => FONTS[f]))];
  if (!uniq.length) return '';
  const q = uniq.map((f) => 'family=' + f.replace(/ /g, '+') + ':wght@400;600;700').join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

export const EVENT_TYPES = {
  boda: 'Boda',
  aniversario: 'Aniversario',
  despedida: 'Despedida',
  xv: 'XV Años',
  cumple: 'Cumpleaños',
  baby: 'Baby shower',
  bautizo: 'Bautizo',
  graduacion: 'Graduación',
  bienvenida: 'Bienvenida',
  reencuentro: 'Reencuentro',
  cena: 'Cena familiar',
  torneo: 'Torneo / eSports',
  lan: 'LAN party',
  juego: 'Lanzamiento de juego',
  stream: 'Watch party',
  rol: 'Rol / juegos de mesa',
  fiesta: 'Fiesta',
  halloween: 'Halloween / disfraces',
  anonuevo: 'Año Nuevo',
  bbq: 'Junte / BBQ',
  pool: 'Pool party',
  openhouse: 'Open house',
  corporativo: 'Corporativo',
  producto: 'Lanzamiento de producto',
  taller: 'Taller',
  conferencia: 'Conferencia',
  meetup: 'Meetup',
  benefico: 'Evento benéfico',
};

// Agrupación para los filtros de plantillas
export const CATEGORIES = {
  amor: { name: 'Amor', types: ['boda', 'aniversario', 'despedida'] },
  familia: { name: 'Familia', types: ['xv', 'cumple', 'baby', 'bautizo', 'graduacion', 'bienvenida', 'reencuentro', 'cena'] },
  gamer: { name: 'Gamer y tech', types: ['torneo', 'lan', 'juego', 'stream', 'rol'] },
  fiestas: { name: 'Fiestas', types: ['fiesta', 'halloween', 'anonuevo', 'bbq', 'pool', 'openhouse'] },
  pro: { name: 'Profesional', types: ['corporativo', 'producto', 'taller', 'conferencia', 'meetup', 'benefico'] },
};
export const categoryOf = (type) => Object.keys(CATEGORIES).find((k) => CATEGORIES[k].types.includes(type)) || 'fiestas';

export const LAYOUTS = { clasico: 'Clásico', moderno: 'Moderno', elegante: 'Elegante', neon: 'Neón' };
export const PATTERNS = { none: 'Liso', dots: 'Puntos', lines: 'Líneas', paper: 'Papel' };

// ---------- Decoraciones (SVG generado, coloreado con el tema) ----------
// Cada una devuelve el SVG de una esquina (se refleja para la opuesta).

function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function flower(cx, cy, r, petal, center) {
  let p = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 * Math.PI) / 180;
    const x = cx + Math.cos(a) * r * 0.55;
    const y = cy + Math.sin(a) * r * 0.55;
    p += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r * 0.5).toFixed(1)}" ry="${(r * 0.32).toFixed(1)}" transform="rotate(${i * 60} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${petal}" opacity=".85"/>`;
  }
  return p + `<circle cx="${cx}" cy="${cy}" r="${(r * 0.25).toFixed(1)}" fill="${center}"/>`;
}

function leaf(x, y, len, rot, color) {
  return `<path d="M0 0 Q ${len / 2} ${-len / 3} ${len} 0 Q ${len / 2} ${len / 3} 0 0Z" fill="${color}" transform="translate(${x} ${y}) rotate(${rot})" opacity=".8"/>`;
}

function star(x, y, r, color, op = 1) {
  return `<path d="M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25}Z" fill="${color}" opacity="${op}"/>`;
}

export const DECOS = {
  floral: {
    name: 'Floral',
    corner(c) {
      let s = '';
      s += `<path d="M0 30 Q 60 40 110 10 M10 0 Q 30 60 5 120" stroke="${c.accent}" stroke-width="2" fill="none" opacity=".6"/>`;
      [[20, 110, 70], [60, 40, -20], [95, 18, 10], [8, 70, 100], [130, 8, -10]].forEach(([x, y, r]) => (s += leaf(x, y, 34, r, c.accent)));
      s += flower(38, 38, 36, c.primary, c.accent);
      s += flower(92, 30, 22, c.primary, c.accent);
      s += flower(28, 92, 22, c.primary, c.accent);
      s += flower(70, 75, 14, c.accent, c.primary);
      return s;
    },
  },
  dorado: {
    name: 'Art déco',
    corner(c) {
      let s = '';
      for (let i = 0; i < 4; i++) {
        const o = 8 + i * 9;
        s += `<path d="M${o} 160 V${o} H160" stroke="${c.accent}" stroke-width="${i === 0 ? 2.5 : 1}" fill="none" opacity="${1 - i * 0.18}"/>`;
      }
      s += `<path d="M44 44 L70 44 L44 70Z" fill="${c.accent}" opacity=".9"/>`;
      s += `<circle cx="44" cy="44" r="5" fill="${c.primary}" stroke="${c.accent}" stroke-width="2"/>`;
      for (let i = 0; i < 5; i++) s += `<line x1="44" y1="44" x2="${80 + i * 14}" y2="${130 - i * 18}" stroke="${c.accent}" stroke-width=".8" opacity=".5"/>`;
      return s;
    },
  },
  hojas: {
    name: 'Hojas',
    corner(c) {
      let s = `<path d="M0 0 Q 70 50 150 40" stroke="${c.accent}" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const x = t * 150, y = 40 * t * t + 50 * t * (1 - t) * 1.4;
        s += leaf(x, y, 30 - i * 2, -60 + i * 4, c.primary);
        s += leaf(x, y, 28 - i * 2, 40 + i * 4, c.accent);
      }
      s += `<path d="M0 0 Q 40 70 30 150" stroke="${c.accent}" stroke-width="2" fill="none"/>`;
      for (let i = 1; i < 6; i++) {
        const t = i / 6;
        s += leaf(40 * t * 1.2 - 6 * t * t, 150 * t, 26, 20 + i * 5, c.primary);
      }
      return s;
    },
  },
  confeti: {
    name: 'Confeti',
    corner(c) {
      const r = seeded(7), cols = [c.primary, c.accent, c.text];
      let s = '';
      for (let i = 0; i < 34; i++) {
        const x = r() * 170, y = r() * 170;
        if (x + y > 200) continue;
        const col = cols[i % 3];
        s += i % 2
          ? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="10" height="5" rx="1.5" fill="${col}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`
          : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 4).toFixed(1)}" fill="${col}"/>`;
      }
      s += `<path d="M10 60 q 15 -20 30 0 t 30 0 t 30 0" stroke="${c.accent}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    },
  },
  estrellas: {
    name: 'Estrellas',
    corner(c) {
      const r = seeded(3);
      let s = '';
      for (let i = 0; i < 18; i++) {
        const x = 8 + r() * 150, y = 8 + r() * 150;
        if (x + y > 190) continue;
        s += star(x, y, 3 + r() * 9, i % 3 ? c.accent : c.primary, 0.5 + r() * 0.5);
      }
      s += `<path d="M60 10 a 40 40 0 1 0 40 55 a 32 32 0 1 1 -40 -55z" fill="${c.accent}" opacity=".9"/>`;
      return s;
    },
  },
  globos: {
    name: 'Globos',
    corner(c) {
      const b = (x, y, rx, col) =>
        `<path d="M${x} ${y + rx * 1.2} q -6 30 6 60" stroke="${c.text}" stroke-width="1" fill="none" opacity=".5"/>` +
        `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 1.2}" fill="${col}"/>` +
        `<ellipse cx="${x - rx * 0.35}" cy="${y - rx * 0.45}" rx="${rx * 0.2}" ry="${rx * 0.35}" fill="#fff" opacity=".45"/>` +
        `<path d="M${x - 4} ${y + rx * 1.2 + 4} h8 l-4 -6z" fill="${col}"/>`;
      return b(30, 40, 24, c.primary) + b(80, 28, 20, c.accent) + b(58, 85, 18, c.text) + b(118, 40, 14, c.primary);
    },
  },
  mariposas: {
    name: 'Mariposas',
    corner(c) {
      const bf = (x, y, sz, rot, col) =>
        `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sz})">` +
        `<path d="M0 0 C -18 -26 -40 -8 -22 6 C -34 22 -12 30 0 6Z" fill="${col}" opacity=".85"/>` +
        `<path d="M0 0 C 18 -26 40 -8 22 6 C 34 22 12 30 0 6Z" fill="${col}" opacity=".7"/>` +
        `<path d="M0 -4 V12" stroke="${c.text}" stroke-width="2"/></g>`;
      let s = `<path d="M5 140 C 30 90 60 120 90 70 S 140 40 160 10" stroke="${c.accent}" stroke-width="1.4" stroke-dasharray="3 5" fill="none"/>`;
      s += bf(40, 40, 1.3, -15, c.primary) + bf(105, 35, 0.8, 20, c.accent) + bf(30, 110, 0.7, 10, c.accent);
      return s;
    },
  },
  pixel: {
    name: 'Pixel',
    corner(c) {
      const r = seeded(11), z = 10;
      let s = '';
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
        const d = x + y;
        if (d > 12 || r() > 1 - d / 14) continue;
        s += `<rect x="${x * z}" y="${y * z}" width="${z}" height="${z}" fill="${(x * 7 + y) % 3 ? c.primary : c.accent}" opacity="${(1 - d / 16).toFixed(2)}"/>`;
      }
      const sprite = (rows, ox, oy, px, col) => rows.forEach((row, j) => [...row].forEach((v, i) => v === '1' && (s += `<rect x="${ox + i * px}" y="${oy + j * px}" width="${px}" height="${px}" fill="${col}"/>`)));
      sprite(['01100110', '11111111', '11111111', '01111110', '00111100', '00011000'], 40, 112, 6, c.accent);
      sprite(['00100', '01110', '11111', '01110', '00100'], 118, 26, 6, c.primary);
      return s;
    },
  },
  circuito: {
    name: 'Circuito',
    corner(c) {
      const paths = ['M0 20 H60 L80 40 H140', 'M0 45 H40 L60 65 V110', 'M20 0 V50 L35 65 H50', 'M50 0 V20 L70 40', 'M0 80 H25 L40 95 V150', 'M95 0 V25 L110 40 H160'];
      const ends = [[140, 40], [60, 110], [50, 65], [70, 40], [40, 150], [160, 40]];
      let s = paths.map((d, i) => `<path d="${d}" stroke="${i % 2 ? c.accent : c.primary}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
      s += ends.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${c.card}" stroke="${i % 2 ? c.accent : c.primary}" stroke-width="2.5"/>`).join('');
      return s;
    },
  },
  dados: {
    name: 'Dados',
    corner(c) {
      const P = { 1: [[0, 0]], 3: [[-1, -1], [0, 0], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] };
      const die = (x, y, sz, rot, n, col) => `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-sz / 2}" y="${-sz / 2}" width="${sz}" height="${sz}" rx="${sz * 0.18}" fill="${col}"/>` +
        P[n].map(([a, b]) => `<circle cx="${a * sz * 0.27}" cy="${b * sz * 0.27}" r="${sz * 0.09}" fill="${c.card}"/>`).join('') + '</g>';
      const hex = [...Array(6)].map((_, i) => { const a = Math.PI / 6 + (i * Math.PI) / 3; return [120 + 26 * Math.cos(a), 40 + 26 * Math.sin(a)]; });
      const pts = (arr) => arr.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
      return die(45, 45, 48, -12, 5, c.primary) + die(32, 112, 32, 15, 3, c.accent) +
        `<polygon points="${pts(hex)}" fill="none" stroke="${c.accent}" stroke-width="2"/><polygon points="${pts([hex[1], hex[3], hex[5]])}" fill="none" stroke="${c.accent}" stroke-width="1.5"/>` +
        hex.map((p, i) => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${hex[[3, 1, 1, 5, 5, 3][i]][0].toFixed(1)}" y2="${hex[[3, 1, 1, 5, 5, 3][i]][1].toFixed(1)}" stroke="${c.accent}" stroke-width="1" opacity=".6"/>`).join('');
    },
  },
  murcielagos: {
    name: 'Murciélagos',
    corner(c) {
      let s = '';
      for (let i = 0; i <= 4; i++) { const a = (i * Math.PI) / 8; s += `<line x1="0" y1="0" x2="${(150 * Math.cos(a)).toFixed(1)}" y2="${(150 * Math.sin(a)).toFixed(1)}" stroke="${c.text}" stroke-width="1" opacity=".3"/>`; }
      [40, 75, 110].forEach((rr) => {
        const pts = [...Array(5)].map((_, i) => { const a = (i * Math.PI) / 8; return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`; });
        s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c.text}" stroke-width="1" opacity=".3"/>`;
      });
      s += `<circle cx="112" cy="42" r="24" fill="${c.accent}" opacity=".95"/>`;
      const bat = (x, y, k) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 2 C-3 -2 -4 -6 -3 -8 L-1 -5 L1 -5 L3 -8 C4 -6 3 -2 0 2 Z M-2 0 C-8 -8 -16 -8 -22 -4 C-18 -3 -16 1 -17 5 C-13 2 -9 3 -7 7 C-5 3 -3 2 -1 3 Z M2 0 C8 -8 16 -8 22 -4 C18 -3 16 1 17 5 C13 2 9 3 7 7 C5 3 3 2 1 3 Z" fill="${c.primary}"/>`;
      return s + bat(62, 92, 1.5) + bat(128, 96, 1) + bat(36, 140, 0.8);
    },
  },
  fuegos: {
    name: 'Fuegos artificiales',
    corner(c) {
      const burst = (cx, cy, r, col, n) => [...Array(n)].map((_, i) => {
        const a = (i * 2 * Math.PI) / n, x1 = cx + Math.cos(a) * r * 0.3, y1 = cy + Math.sin(a) * r * 0.3, x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r;
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="2" stroke-linecap="round"/><circle cx="${(cx + Math.cos(a) * (r + 6)).toFixed(1)}" cy="${(cy + Math.sin(a) * (r + 6)).toFixed(1)}" r="1.8" fill="${col}"/>`;
      }).join('');
      return burst(52, 52, 38, c.accent, 14) + burst(125, 32, 20, c.primary, 10) + burst(30, 125, 18, c.primary, 10) + star(100, 95, 6, c.accent) + star(140, 75, 4, c.primary);
    },
  },
  olas: {
    name: 'Sol y olas',
    corner(c) {
      let s = `<circle cx="42" cy="42" r="24" fill="${c.accent}"/>`;
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5; s += `<line x1="${(42 + Math.cos(a) * 31).toFixed(1)}" y1="${(42 + Math.sin(a) * 31).toFixed(1)}" x2="${(42 + Math.cos(a) * 40).toFixed(1)}" y2="${(42 + Math.sin(a) * 40).toFixed(1)}" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>`; }
      [96, 114, 132].forEach((y, i) => (s += `<path d="M0 ${y} q 15 -10 30 0 t 30 0 t 30 0 t 30 0 t 30 0" stroke="${i % 2 ? c.accent : c.primary}" stroke-width="4" fill="none" stroke-linecap="round" opacity="${1 - i * 0.25}"/>`));
      return s;
    },
  },
  minimal: {
    name: 'Minimal',
    corner(c) {
      return `<path d="M16 120 V16 H120" stroke="${c.accent}" stroke-width="1.5" fill="none"/><circle cx="16" cy="16" r="4" fill="${c.accent}"/>`;
    },
  },
  ninguna: { name: 'Ninguna', corner: () => '' },
};

export function cornerSVG(deco, colors) {
  const d = DECOS[deco] || DECOS.minimal;
  const body = d.corner(colors);
  if (!body) return '';
  return `<svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
}

export function dividerSVG(colors) {
  const c = colors.accent;
  return `<svg viewBox="0 0 200 20" aria-hidden="true"><line x1="0" y1="10" x2="80" y2="10" stroke="${c}" stroke-width="1"/><line x1="120" y1="10" x2="200" y2="10" stroke="${c}" stroke-width="1"/><path d="M100 2 L108 10 L100 18 L92 10Z" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="100" cy="10" r="2.5" fill="${c}"/></svg>`;
}

// ---------- Plantillas base ----------
const T = (id, name, type, theme, ev, extra) => ({ id, name, type, theme, ev, extra });

export const TEMPLATES = [
  T('boda-jardin', 'Jardín', 'boda',
    { layout: 'clasico', deco: 'floral', bg: '#f7f3ee', card: '#fffdf9', text: '#4a4440', primary: '#e8b4b8', accent: '#9aab89', fontTitle: 'Great Vibes', fontBody: 'Cormorant Garamond', pattern: 'paper' },
    { pre: 'Nos casamos', names: 'Ana & Luis', msg: 'Con la bendición de Dios y de nuestros padres, tenemos el honor de invitarte a celebrar nuestra unión.' }),
  T('boda-dorada', 'Noche dorada', 'boda',
    { layout: 'elegante', deco: 'dorado', bg: '#0f1a2e', card: '#14213d', text: '#f1e9da', primary: '#14213d', accent: '#d4af37', fontTitle: 'Cinzel', fontBody: 'Montserrat', pattern: 'lines' },
    { pre: 'Nuestra boda', names: 'Carla & Andrés', msg: 'Hay momentos que merecen ser compartidos. Acompáñanos en el día más especial de nuestras vidas.' }),
  T('boda-minimal', 'Minimal', 'boda',
    { layout: 'moderno', deco: 'minimal', bg: '#ffffff', card: '#ffffff', text: '#1d1d1f', primary: '#1d1d1f', accent: '#b08d57', fontTitle: 'Playfair Display', fontBody: 'Montserrat', pattern: 'none' },
    { pre: 'Save the date', names: 'Laura & Miguel', msg: 'Queremos que seas parte de este nuevo capítulo.' }),
  T('xv-mariposas', 'Mariposas', 'xv',
    { layout: 'clasico', deco: 'mariposas', bg: '#fbeff5', card: '#ffffff', text: '#5b3a55', primary: '#e6a1c5', accent: '#b48ad6', fontTitle: 'Parisienne', fontBody: 'Quicksand', pattern: 'dots' },
    { pre: 'Mis XV años', names: 'Valentina', msg: 'Hay momentos inolvidables que se atesoran en el corazón para siempre. Acompáñame a celebrar mis quince años.' }),
  T('xv-noche', 'Noche estrellada', 'xv',
    { layout: 'elegante', deco: 'estrellas', bg: '#1b1035', card: '#24164a', text: '#f3eaff', primary: '#9b6dff', accent: '#ffd36e', fontTitle: 'Great Vibes', fontBody: 'Josefin Sans', pattern: 'dots' },
    { pre: 'Mis XV años', names: 'Isabella', msg: 'Esta noche las estrellas brillan por un sueño cumplido. ¡Te espero!' }),
  T('cumple-fiesta', 'Fiesta', 'cumple',
    { layout: 'moderno', deco: 'confeti', bg: '#fff6e5', card: '#ffffff', text: '#2b2240', primary: '#ff5d73', accent: '#2ec4b6', fontTitle: 'Pacifico', fontBody: 'Poppins', pattern: 'dots' },
    { pre: '¡Vamos a celebrar!', names: 'Los 30 de Kevin', msg: 'Trae tu mejor energía, que la fiesta va hasta que el cuerpo aguante.' }),
  T('cumple-infantil', 'Globos', 'cumple',
    { layout: 'clasico', deco: 'globos', bg: '#e9f7ff', card: '#ffffff', text: '#203a5c', primary: '#ff8fab', accent: '#ffc93c', fontTitle: 'Baloo 2', fontBody: 'Quicksand', pattern: 'dots' },
    { pre: '¡Estás invitado!', names: 'Mateo cumple 5', msg: '¡Ven a jugar, comer bizcocho y celebrar conmigo!' }),
  T('baby-hojas', 'Dulce espera', 'baby',
    { layout: 'clasico', deco: 'hojas', bg: '#f1f6f2', card: '#ffffff', text: '#3f4d45', primary: '#c7dcc8', accent: '#d9b48f', fontTitle: 'Dancing Script', fontBody: 'Quicksand', pattern: 'paper' },
    { pre: 'Baby shower', names: 'Bebé en camino', msg: 'Un pequeño milagro está por llegar. Acompáñanos a celebrar su dulce espera.' }),
  T('bautizo', 'Bautizo', 'bautizo',
    { layout: 'clasico', deco: 'hojas', bg: '#eef4fb', card: '#ffffff', text: '#2f4560', primary: '#bcd4ee', accent: '#c9a96e', fontTitle: 'Parisienne', fontBody: 'Lora', pattern: 'none' },
    { pre: 'Mi bautizo', names: 'Santiago', msg: 'Con mucha alegría te invitamos a acompañarnos en este día tan importante.' }),
  T('graduacion', 'Graduación', 'graduacion',
    { layout: 'moderno', deco: 'estrellas', bg: '#111111', card: '#1a1a1a', text: '#f5f5f5', primary: '#2a2a2a', accent: '#e0b84c', fontTitle: 'Cinzel', fontBody: 'Josefin Sans', pattern: 'lines' },
    { pre: '¡Lo logré!', names: 'Clase 2026', msg: 'Después de tanto esfuerzo, llegó el momento de celebrar. Acompáñame en mi graduación.' }),
  T('aniversario', 'Aniversario', 'aniversario',
    { layout: 'elegante', deco: 'floral', bg: '#3b0d17', card: '#4a1220', text: '#f8e9e3', primary: '#a8324a', accent: '#e7c27d', fontTitle: 'Great Vibes', fontBody: 'Cormorant Garamond', pattern: 'paper' },
    { pre: '25 años juntos', names: 'Rosa & Manuel', msg: 'Celebramos nuestras bodas de plata y queremos compartirlo contigo.' }),
  T('corporativo', 'Corporativo', 'corporativo',
    { layout: 'moderno', deco: 'minimal', bg: '#f2f5f7', card: '#ffffff', text: '#14323f', primary: '#0f4c5c', accent: '#2a9d8f', fontTitle: 'Montserrat', fontBody: 'Montserrat', pattern: 'none' },
    { pre: 'Te invitamos', names: 'Lanzamiento 2027', msg: 'Acompáñanos en la presentación de nuestra nueva visión.' }),
  T('navidad', 'Navidad', 'fiesta',
    { layout: 'clasico', deco: 'hojas', bg: '#0f3b2e', card: '#13493a', text: '#fbf3e4', primary: '#1f6b52', accent: '#d6463a', fontTitle: 'Great Vibes', fontBody: 'Lora', pattern: 'dots' },
    { pre: 'Fiesta de Navidad', names: 'Familia Pérez', msg: 'Ven a compartir el pernil, el moro y la alegría de estas fiestas con nosotros.' }),
  // ---- Amor ----
  T('aniversario-novios', 'Nuestro aniversario', 'aniversario',
    { layout: 'clasico', deco: 'mariposas', bg: '#fdf0f2', card: '#ffffff', text: '#5a2a3a', primary: '#f4a7b9', accent: '#c94f6d', fontTitle: 'Dancing Script', fontBody: 'Lora', pattern: 'dots' },
    { pre: 'Un año más juntos', names: 'Sol & Jhon', msg: 'Celebremos juntos otro año de amor, risas y aventuras.' },
    { itin: [['20:00', 'Cena'], ['21:30', 'Brindis'], ['22:00', 'Música y baile']], dress: 'Casual elegante' }),
  T('despedida', 'Última noche', 'despedida',
    { layout: 'elegante', deco: 'estrellas', bg: '#2a0f2e', card: '#3a1540', text: '#ffeaf6', primary: '#ff6fb5', accent: '#f7c873', fontTitle: 'Great Vibes', fontBody: 'Poppins', pattern: 'dots' },
    { pre: 'Despedida de soltera', names: 'La última de Karla', msg: 'Antes del "sí, acepto", ¡una noche que nadie va a olvidar! Lo que pasa en la despedida, se queda en la despedida.' },
    { itin: [['20:00', 'Pre-copeo'], ['21:30', 'Cena'], ['23:00', 'Discoteca']], dress: 'Todas de rosado' }),
  // ---- Familia ----
  T('bienvenida', '¡Bienvenido!', 'bienvenida',
    { layout: 'moderno', deco: 'confeti', bg: '#fff8ec', card: '#ffffff', text: '#2c2a3a', primary: '#ffb703', accent: '#fb5607', fontTitle: 'Baloo 2', fontBody: 'Poppins', pattern: 'dots' },
    { pre: '¡Volvió!', names: 'Bienvenido a casa, Luis', msg: 'Después de tanto tiempo fuera, Luis está de vuelta. Ven a darle el abrazo que le debemos.' },
    { itin: [['15:00', 'Llegada sorpresa'], ['16:00', 'Comida'], ['18:00', 'Dominó y música']], dress: 'Casual' }),
  T('reencuentro', 'Reencuentro', 'reencuentro',
    { layout: 'elegante', deco: 'estrellas', bg: '#101c33', card: '#162544', text: '#eef2fb', primary: '#3a5a99', accent: '#e8c15a', fontTitle: 'Playfair Display', fontBody: 'Montserrat', pattern: 'lines' },
    { pre: 'Promoción 2016', names: '10 años después', msg: 'Los mismos de siempre, con unas canas más. Volvamos a juntarnos como en los viejos tiempos.' },
    { itin: [['19:00', 'Llegada y fotos'], ['20:00', 'Cena'], ['21:30', 'Recuerdos y música']], dress: 'Casual elegante' }),
  T('cena-familiar', 'Cena en familia', 'cena',
    { layout: 'clasico', deco: 'hojas', bg: '#f6efe7', card: '#fffaf4', text: '#4b3426', primary: '#d9a679', accent: '#a0522d', fontTitle: 'Parisienne', fontBody: 'Lora', pattern: 'paper' },
    { pre: 'Domingo familiar', names: 'Almuerzo donde Mamá', msg: 'Sancocho, cuentos y la familia completa. No faltes, que la silla tuya está puesta.' },
    { itin: [['13:00', 'Llegada'], ['14:00', 'Almuerzo'], ['16:00', 'Café y postre']], dress: 'Como tú quieras' }),
  // ---- Gamer y tech ----
  T('torneo', 'Torneo eSports', 'torneo',
    { layout: 'neon', deco: 'circuito', bg: '#07070f', card: '#0e0e1c', text: '#e9ecff', primary: '#ff2e88', accent: '#00e5ff', fontTitle: 'Bebas Neue', fontBody: 'Rajdhani', pattern: 'lines' },
    { pre: 'Torneo · Eliminación doble', names: 'Fight Night Cup', msg: 'Trae tu control, tu main y tu mejor juego. Solo uno se lleva el trofeo. ¿Tú das la talla?' },
    { itin: [['14:00', 'Check-in'], ['14:30', 'Fase de grupos'], ['18:00', 'Top 8'], ['20:00', 'Gran final']], dress: 'Trae tu propio control 🎮', label: 'Sede' }),
  T('lan-party', 'LAN party', 'lan',
    { layout: 'neon', deco: 'pixel', bg: '#0a0f0a', card: '#101a10', text: '#d9ffd9', primary: '#1f8f3a', accent: '#39ff14', fontTitle: 'Press Start 2P', fontBody: 'Rajdhani', pattern: 'dots' },
    { pre: 'Noche de gaming', names: 'LAN Party', msg: 'Trae tu PC o tu consola, cables y extensión. Nosotros ponemos la red, la pizza y el café para aguantar hasta el amanecer.' },
    { itin: [['19:00', 'Montaje y red'], ['20:00', 'Primera partida'], ['00:00', 'Pizza'], ['06:00', 'GG']], dress: 'Trae: PC/consola, audífonos, cable de red' }),
  T('lanzamiento-juego', 'Launch party', 'juego',
    { layout: 'moderno', deco: 'pixel', bg: '#14082b', card: '#1d0f3d', text: '#f5ecff', primary: '#7b2ff7', accent: '#ffcc00', fontTitle: 'Press Start 2P', fontBody: 'Poppins', pattern: 'dots' },
    { pre: 'Ya salió', names: 'Mi juego indie', msg: 'Después de meses de código, bugs y café, el juego está listo. Ven a jugarlo primero que nadie y celebra con nosotros.' },
    { itin: [['18:00', 'Demo jugable'], ['19:00', 'Presentación del equipo'], ['20:00', 'Speedrun en vivo']], dress: 'Casual' }),
  T('watch-party', 'Watch party', 'stream',
    { layout: 'neon', deco: 'circuito', bg: '#0b0716', card: '#140d26', text: '#f1e9ff', primary: '#9146ff', accent: '#ff4f9a', fontTitle: 'Orbitron', fontBody: 'Rajdhani', pattern: 'lines' },
    { pre: 'Watch party', names: 'Gran Final Mundial', msg: 'Pantalla grande, sonido duro y la gente que más grita. Ven a verla con nosotros.' },
    { itin: [['17:00', 'Pre-show'], ['18:00', 'Empieza la transmisión'], ['21:00', 'Análisis y cierre']], dress: 'Ponte la camiseta de tu equipo' }),
  T('rol', 'Noche de rol', 'rol',
    { layout: 'elegante', deco: 'dados', bg: '#2b2118', card: '#f3e6c8', text: '#3a2a1a', primary: '#8b2e2e', accent: '#a0782a', fontTitle: 'MedievalSharp', fontBody: 'Lora', pattern: 'paper' },
    { pre: 'Sesión de rol', names: 'La Cripta Olvidada', msg: 'Aventureros: el reino los necesita. Traigan su hoja de personaje, sus dados y algo de picar para la taberna.' },
    { itin: [['18:00', 'Creación de personajes'], ['19:00', 'Comienza la campaña'], ['23:00', 'Fin de la sesión']], dress: 'Trae: dados, lápiz y hoja de personaje' }),
  // ---- Fiestas ----
  T('halloween', 'Halloween', 'halloween',
    { layout: 'clasico', deco: 'murcielagos', bg: '#120d0a', card: '#1e1712', text: '#f6e7d4', primary: '#ff7a1a', accent: '#f2c14e', fontTitle: 'Creepster', fontBody: 'Poppins', pattern: 'dots' },
    { pre: 'Fiesta de disfraces', names: 'Noche de Terror', msg: 'Ven disfrazado o no entras. Habrá premio al mejor disfraz... y algún susto.' },
    { itin: [['21:00', 'Llegada'], ['22:30', 'Concurso de disfraces'], ['00:00', 'Hora del terror']], dress: 'Disfraz obligatorio 🎃' }),
  T('ano-nuevo', 'Año Nuevo', 'anonuevo',
    { layout: 'elegante', deco: 'fuegos', bg: '#0c0c0c', card: '#151515', text: '#f7f1e3', primary: '#c0c0c0', accent: '#e6be5a', fontTitle: 'Cinzel', fontBody: 'Josefin Sans', pattern: 'dots' },
    { pre: 'Despidamos el año', names: 'Fiesta 2027', msg: 'Doce uvas, mucho brindis y la mejor gente para recibir el año. ¡Te esperamos!' },
    { itin: [['21:00', 'Cena'], ['23:45', 'Uvas y cuenta regresiva'], ['00:00', '¡Feliz Año!']], dress: 'Dorado, plateado o negro' }),
  T('junte-bbq', 'Junte / BBQ', 'bbq',
    { layout: 'moderno', deco: 'confeti', bg: '#fff3e6', card: '#ffffff', text: '#3b2414', primary: '#e63946', accent: '#f4a261', fontTitle: 'Baloo 2', fontBody: 'Poppins', pattern: 'lines' },
    { pre: 'Junte en el patio', names: 'Parrilla y Música', msg: 'Carne en la parrilla, el frío en la nevera y la bocina prendida. Trae lo tuyo y ven a compartir.' },
    { itin: [['14:00', 'Se prende el carbón'], ['15:30', 'A comer'], ['17:00', 'Dominó y bachata']], dress: 'Fresco y cómodo' }),
  T('pool-party', 'Pool party', 'pool',
    { layout: 'clasico', deco: 'olas', bg: '#e6fbff', card: '#ffffff', text: '#06364a', primary: '#00b4d8', accent: '#ffb703', fontTitle: 'Pacifico', fontBody: 'Quicksand', pattern: 'dots' },
    { pre: 'Pool party', names: '¡A la piscina!', msg: 'Sol, agua y buena música. Trae tu traje de baño, toalla y bloqueador.' },
    { itin: [['11:00', 'Piscina abierta'], ['13:30', 'Almuerzo'], ['16:00', 'Juegos en el agua']], dress: 'Traje de baño' }),
  T('open-house', 'Open house', 'openhouse',
    { layout: 'moderno', deco: 'hojas', bg: '#f1f3ee', card: '#ffffff', text: '#2f3a2f', primary: '#a3b18a', accent: '#588157', fontTitle: 'Playfair Display', fontBody: 'Quicksand', pattern: 'none' },
    { pre: 'Casa nueva', names: 'Open House', msg: 'Por fin tenemos nuestro propio espacio y queremos que lo conozcas. Pasa a celebrar con nosotros.' },
    { itin: [['16:00', 'Recorrido'], ['17:00', 'Picadera'], ['19:00', 'Brindis']], dress: 'Casual' }),
  // ---- Profesional ----
  T('lanzamiento-producto', 'Lanzamiento', 'producto',
    { layout: 'moderno', deco: 'fuegos', bg: '#0f1222', card: '#161a30', text: '#eef0ff', primary: '#4361ee', accent: '#f72585', fontTitle: 'Montserrat', fontBody: 'Montserrat', pattern: 'lines' },
    { pre: 'Lanzamiento oficial', names: 'Nueva App 2.0', msg: 'Te invitamos a ser de los primeros en conocer lo nuevo que tenemos. Habrá demo en vivo, networking y sorpresas.' },
    { itin: [['18:00', 'Registro'], ['18:30', 'Presentación'], ['19:15', 'Demo en vivo'], ['20:00', 'Networking']], dress: 'Business casual' }),
  T('taller', 'Taller', 'taller',
    { layout: 'moderno', deco: 'circuito', bg: '#f4f7fb', card: '#ffffff', text: '#14213d', primary: '#3a86ff', accent: '#ff006e', fontTitle: 'Montserrat', fontBody: 'Poppins', pattern: 'dots' },
    { pre: 'Taller práctico', names: 'Crea tu primer videojuego', msg: 'Aprende desde cero en una sesión práctica. Trae tu laptop: salimos con algo funcionando.' },
    { itin: [['09:00', 'Instalación'], ['09:30', 'Conceptos básicos'], ['11:00', 'Manos a la obra'], ['12:30', 'Demo final']], dress: 'Trae tu laptop y cargador', label: 'Aula' }),
  T('conferencia', 'Conferencia', 'conferencia',
    { layout: 'elegante', deco: 'minimal', bg: '#eef1f5', card: '#ffffff', text: '#1b263b', primary: '#415a77', accent: '#0d9488', fontTitle: 'Playfair Display', fontBody: 'Montserrat', pattern: 'none' },
    { pre: 'Conferencia', names: 'El futuro de la IA', msg: 'Una charla sobre tendencias, retos y oportunidades, seguida de preguntas del público.' },
    { itin: [['18:00', 'Registro'], ['18:30', 'Charla principal'], ['19:30', 'Preguntas'], ['20:00', 'Café y networking']], dress: 'Business casual', label: 'Auditorio' }),
  T('meetup', 'Meetup', 'meetup',
    { layout: 'neon', deco: 'circuito', bg: '#11111b', card: '#1a1a2a', text: '#ececff', primary: '#5b5bd6', accent: '#2dd4bf', fontTitle: 'Orbitron', fontBody: 'Poppins', pattern: 'dots' },
    { pre: 'Meetup de la comunidad', names: 'Devs Santo Domingo', msg: 'Charlas cortas, pizza y gente que comparte la misma pasión. Ven aunque sea tu primera vez.' },
    { itin: [['18:30', 'Llegada y pizza'], ['19:00', 'Lightning talks'], ['20:30', 'Networking']], dress: 'Casual' }),
  T('benefico', 'Evento benéfico', 'benefico',
    { layout: 'clasico', deco: 'hojas', bg: '#eef6ef', card: '#ffffff', text: '#1f3a2b', primary: '#95d5b2', accent: '#2d6a4f', fontTitle: 'Playfair Display', fontBody: 'Lora', pattern: 'paper' },
    { pre: 'Evento benéfico', names: 'Juntos por la escuela', msg: 'Cada aporte cuenta. Acompáñanos en una tarde para recaudar fondos para útiles escolares de la comunidad.' },
    { itin: [['16:00', 'Bienvenida'], ['16:30', 'Subasta'], ['18:00', 'Rifa y cierre']], dress: 'Casual' }),
];

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id);
}

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Invitación completa a partir de una plantilla
// Límites de la plataforma (cámbialos aquí si hace falta)
export const MAX_PEOPLE = 100; // suma de pases de todos los invitados
export const MIN_GUESTS = 1;   // invitaciones necesarias para poder enviar

// Campos del formulario de confirmación: off = no se pide, opt = opcional, req = obligatorio
export const RSVP_FIELDS = {
  phone: 'Teléfono',
  count: 'Número de personas',
  companions: 'Nombres de acompañantes',
  diet: 'Alergias o restricciones de comida',
  song: 'Canción que no puede faltar',
  msg: 'Mensaje para los anfitriones',
  custom: 'Pregunta personalizada',
};
export const defaultRsvpFields = () => ({ phone: 'off', count: 'req', companions: 'off', diet: 'off', song: 'off', msg: 'opt', custom: 'off', customQ: '' });

// Orden por defecto de las secciones (la portada siempre va primero)
export const SECTION_ORDER = ['msg', 'countdown', 'places', 'itin', 'dress', 'gifts', 'gallery', 'calendar', 'rsvp'];
export function sectionOrder(inv) {
  const o = (inv.order || []).filter((k) => SECTION_ORDER.includes(k));
  return [...new Set([...o, ...SECTION_ORDER])];
}

export function newInvitation(tpl = TEMPLATES[0], lang = 'es') {
  const x = tpl.extra || {};
  const en = lang === 'en' ? TEMPLATES_EN[tpl.id] || {} : null;
  const tr = (s) => ti(lang, s);
  const itin = (x.itin || [['18:00', 'Recepción'], ['19:00', 'Cena'], ['20:30', '¡A bailar!']])
    .map(([time, label], i) => ({ time, label: en ? en.itin?.[i] || tr(label) : label }));
  return {
    v: 1,
    lang,
    tpl: tpl.id,
    theme: { ...tpl.theme, envelope: true },
    ev: {
      type: tpl.type,
      pre: en?.pre ?? tpl.ev.pre,
      names: en?.names ?? tpl.ev.names,
      date: inDays(60),
      time: x.itin?.[0]?.[0] || '18:00',
      msg: en?.msg ?? tpl.ev.msg,
      quote: '',
    },
    cover: '',
    places: [
      { label: en?.label || tr(x.label || (tpl.type === 'boda' ? 'Ceremonia' : 'Lugar')), name: tr('Salón de eventos'), addr: 'Av. Anacaona, Santo Domingo', time: x.itin?.[0]?.[0] || '18:00' },
    ],
    itin,
    dress: { code: en?.dress || tr(x.dress || 'Formal'), note: '' },
    gifts: { note: tr('Tu presencia es nuestro mejor regalo, pero si deseas tener un detalle con nosotros:'), items: [] },
    gallery: [],
    music: '',
    rsvp: { phone: '', deadline: inDays(45), note: '', fields: defaultRsvpFields() },
    order: [...SECTION_ORDER],
    show: { msg: true, countdown: true, places: true, itin: true, dress: true, gifts: false, gallery: false, rsvp: true, calendar: true, table: true },
  };
}

// Aplica sólo el diseño de una plantilla a una invitación existente
export function applyTheme(inv, tpl) {
  inv.tpl = tpl.id;
  inv.theme = { ...tpl.theme, envelope: inv.theme?.envelope ?? true };
  return inv;
}

// Limpia un tema que viene de un link o de un archivo (nunca confiar en él)
const HEX = /^#[0-9a-f]{6}$/i;
export function sanitizeTheme(t = {}) {
  const base = TEMPLATES[0].theme;
  const out = {};
  for (const k of ['bg', 'card', 'text', 'primary', 'accent']) out[k] = HEX.test(t[k]) ? t[k] : base[k];
  out.fontTitle = FONTS[t.fontTitle] ? t.fontTitle : base.fontTitle;
  out.fontBody = FONTS[t.fontBody] ? t.fontBody : base.fontBody;
  out.layout = LAYOUTS[t.layout] ? t.layout : base.layout;
  out.deco = DECOS[t.deco] ? t.deco : base.deco;
  out.pattern = PATTERNS[t.pattern] ? t.pattern : 'none';
  out.envelope = t.envelope !== false;
  return out;
}
