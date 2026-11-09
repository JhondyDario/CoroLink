// Catálogo: fuentes, decoraciones SVG, plantillas base y datos por defecto.

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
};

export function fontsHref(families) {
  const uniq = [...new Set(families.filter((f) => FONTS[f]))];
  if (!uniq.length) return '';
  const q = uniq.map((f) => 'family=' + f.replace(/ /g, '+') + ':wght@400;600;700').join('&');
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

export const EVENT_TYPES = {
  boda: 'Boda',
  xv: 'XV Años',
  cumple: 'Cumpleaños',
  baby: 'Baby shower',
  bautizo: 'Bautizo',
  graduacion: 'Graduación',
  aniversario: 'Aniversario',
  corporativo: 'Corporativo',
  fiesta: 'Fiesta',
};

export const LAYOUTS = { clasico: 'Clásico', moderno: 'Moderno', elegante: 'Elegante' };
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
const T = (id, name, type, theme, ev) => ({ id, name, type, theme, ev });

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
export function newInvitation(tpl = TEMPLATES[0]) {
  return {
    v: 1,
    tpl: tpl.id,
    theme: { ...tpl.theme, envelope: true },
    ev: {
      type: tpl.type,
      pre: tpl.ev.pre,
      names: tpl.ev.names,
      date: inDays(60),
      time: '18:00',
      msg: tpl.ev.msg,
      quote: '',
    },
    cover: '',
    places: [
      { label: tpl.type === 'boda' ? 'Ceremonia' : 'Lugar', name: 'Salón de eventos', addr: 'Av. Anacaona, Santo Domingo', time: '18:00' },
    ],
    itin: [
      { time: '18:00', label: 'Recepción' },
      { time: '19:00', label: 'Cena' },
      { time: '20:30', label: '¡A bailar!' },
    ],
    dress: { code: 'Formal', note: '' },
    gifts: { note: 'Tu presencia es nuestro mejor regalo, pero si deseas tener un detalle con nosotros:', items: [] },
    gallery: [],
    music: '',
    rsvp: { phone: '', deadline: inDays(45), note: '' },
    show: { countdown: true, places: true, itin: true, dress: true, gifts: false, gallery: false, rsvp: true, calendar: true },
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
