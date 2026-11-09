// Convierte los datos de una invitación en HTML. Lo usan el visor y la vista previa.
import { cornerSVG, dividerSVG, fontsHref, EVENT_TYPES, sanitizeTheme, FONT_SCALE, RSVP_FIELDS, defaultRsvpFields, sectionOrder } from './templates.js';
import { ti, fmtDateL, fmtTimeL } from './i18n.js';
import { spotifyEmbed, creditLink } from './media.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sólo dejamos pasar URLs http(s) y data:image para imágenes
export function safeUrl(u, { image = false } = {}) {
  u = String(u || '').trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (image && /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(u)) return u;
  return '';
}

export function waPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  // Números dominicanos (809/829/849) y de EE.UU./Canadá sin código de país
  if (d.length === 10 && /^[2-9]/.test(d)) d = '1' + d;
  return d;
}

export function parseDate(date, time) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh || 0, mm || 0);
  return isNaN(dt) ? null : dt;
}

// Formato de fecha y hora (español por defecto)
export const fmtDate = (dt, l = 'es') => fmtDateL(dt, l);
export const fmtTime = (t, l = 'es') => fmtTimeL(t, l);

export function mapsLink(p) {
  const q = encodeURIComponent([p.name, p.addr].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
export function wazeLink(p) {
  return `https://waze.com/ul?q=${encodeURIComponent([p.name, p.addr].filter(Boolean).join(', '))}&navigate=yes`;
}
function mapEmbed(p) {
  const q = encodeURIComponent([p.name, p.addr].filter(Boolean).join(', '));
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
}

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  if (!m) return '0,0,0';
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function applyThemeVars(el, theme) {
  const c = sanitizeTheme(theme);
  const set = (k, v) => el.style.setProperty(k, v);
  set('--bg', c.bg);
  set('--card', c.card);
  set('--text', c.text);
  set('--primary', c.primary);
  set('--accent', c.accent);
  set('--text-rgb', hexToRgb(c.text));
  set('--accent-rgb', hexToRgb(c.accent));
  set('--font-title', `'${c.fontTitle}', cursive, serif`);
  set('--font-body', `'${c.fontBody}', system-ui, sans-serif`);
  set('--title-scale', String(FONT_SCALE[c.fontTitle] || 1));
}

export function ensureFonts(theme, doc = document) {
  const href = fontsHref([theme.fontTitle, theme.fontBody]);
  let link = doc.getElementById('theme-fonts');
  if (!link) {
    link = doc.createElement('link');
    link.id = 'theme-fonts';
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';
    doc.head.appendChild(link);
  }
  if (href && link.getAttribute('href') !== href) link.setAttribute('href', href);
}

const icon = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shirt: '<svg viewBox="0 0 24 24"><path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4z"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9C9 9 7 4 10 4s2 5 2 5 0-5 3-5 1 5-3 5"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg>',
};

// Qué grupo del editor corresponde a cada parte (para editar tocando la vista previa)
const EDIT_GROUP = { playlist: 'playlist', countdown: 'evento', places: 'lugares', itin: 'itinerario', dress: 'vestimenta', gifts: 'regalos', gallery: 'galeria', rsvp: 'rsvp' };

function section(id, title, body, ic) {
  return `<section class="sec reveal" id="sec-${id}" data-edit="${EDIT_GROUP[id] || 'evento'}">
    ${ic ? `<div class="sec-icon">${icon[ic]}</div>` : ''}
    <h2 class="sec-title">${esc(title)}</h2>
    ${body}
  </section>`;
}

export function renderInvitation(inv, guest = {}) {
  const t = sanitizeTheme(inv.theme), ev = inv.ev || {}, show = inv.show || {};
  const L = inv.lang === 'en' ? 'en' : 'es';
  const tr = (s, v) => ti(L, s, v);
  guest = { name: String(guest.name || '').slice(0, 80), passes: Math.min(99, Math.max(0, parseInt(guest.passes, 10) || 0)), table: String(guest.table || '').slice(0, 40) };
  const dt = parseDate(ev.date, ev.time);
  const corner = cornerSVG(t.deco, t);
  const div = `<div class="divider">${dividerSVG(t)}</div>`;
  const cover = show.cover === false ? '' : safeUrl(inv.cover, { image: true });
  const parts = [];

  // ---------- Portada (siempre primero) ----------
  const tableTag = guest.table && show.table !== false
    ? `<p class="table-tag">${/^(mesa|table)\b/i.test(guest.table) ? `${tr('Te sentamos en la')} <strong>${esc(guest.table)}</strong>` : `${tr('Tu mesa:')} <strong>${esc(guest.table)}</strong>`}</p>`
    : '';
  parts.push(`<header class="hero ${cover ? 'has-cover' : ''}">
    ${cover ? `<div class="hero-img" data-edit="portada" style="background-image:url('${esc(cover)}')"></div>` : ''}
    <div class="hero-card" data-edit="evento">
      ${corner ? `<div class="corner tl">${corner}</div><div class="corner br">${corner}</div>` : ''}
      ${guest.name ? `<p class="guest">${tr('Querido(a)')} <strong>${esc(guest.name)}</strong></p>` : ''}
      ${ev.pre ? `<p class="pre">${esc(ev.pre)}</p>` : ''}
      <h1 class="names">${esc(ev.names || tr(EVENT_TYPES[ev.type] || 'Mi evento'))}</h1>
      ${div}
      ${dt ? `<p class="date-big">${esc(fmtDateL(dt, L))}</p>` : ''}
      ${ev.time ? `<p class="time-big">${esc(fmtTimeL(ev.time, L))}</p>` : ''}
      ${tableTag}
      ${guest.passes ? `<p class="passes">${tr('Hemos reservado')} <strong>${guest.passes}</strong> ${tr(guest.passes === 1 ? 'lugar para ti' : 'lugares para ti')}</p>` : ''}
      <div class="scroll-hint" aria-hidden="true"><span></span></div>
    </div>
  </header>`);

  // ---------- Secciones, en el orden que escogió el anfitrión ----------
  const S = {};
  if (show.msg !== false && (ev.msg || ev.quote)) {
    S.msg = `<section class="sec reveal msg" id="sec-msg" data-edit="evento">
      ${ev.msg ? `<p class="lead">${esc(ev.msg)}</p>` : ''}
      ${ev.quote ? `<blockquote>${esc(ev.quote)}</blockquote>` : ''}
    </section>`;
  }

  if (show.countdown && dt) {
    S.countdown = section('countdown', tr('Faltan'), `<div class="countdown" data-target="${dt.getTime()}">
      ${['Días', 'Horas', 'Min', 'Seg'].map((l) => `<div class="cd"><span class="cd-n">--</span><span class="cd-l">${tr(l)}</span></div>`).join('')}
    </div>`, 'clock');
  }

  if (show.places && inv.places?.length) {
    const cards = inv.places.filter((p) => p.name || p.addr).map((p, i) => `
      <div class="place">
        <h3>${esc(p.label || tr('Lugar'))}</h3>
        <p class="place-name">${esc(p.name)}</p>
        ${p.time ? `<p class="muted">${esc(fmtTimeL(p.time, L))}</p>` : ''}
        ${p.addr ? `<p class="muted">${esc(p.addr)}</p>` : ''}
        <div class="map" data-src="${esc(mapEmbed(p))}" data-i="${i}"><button class="btn ghost small map-load" type="button">${tr('Ver mapa')}</button></div>
        <div class="btn-row">
          <a class="btn" href="${esc(mapsLink(p))}" target="_blank" rel="noopener">Google Maps</a>
          <a class="btn ghost" href="${esc(wazeLink(p))}" target="_blank" rel="noopener">Waze</a>
        </div>
      </div>`).join('');
    if (cards) S.places = section('places', tr('Dónde'), `<div class="places">${cards}</div>`, 'pin');
  }

  if (show.itin && inv.itin?.length) {
    S.itin = section('itin', tr('Itinerario'), `<ol class="timeline">${inv.itin.filter((x) => x.label).map((x) => `
      <li><span class="tl-time">${esc(fmtTimeL(x.time, L))}</span><span class="tl-dot"></span><span class="tl-label">${esc(x.label)}</span></li>`).join('')}</ol>`, 'cal');
  }

  if (show.dress && (inv.dress?.code || inv.dress?.note)) {
    S.dress = section('dress', tr('Código de vestimenta'), `<p class="big">${esc(inv.dress.code)}</p>${inv.dress.note ? `<p class="muted">${esc(inv.dress.note)}</p>` : ''}`, 'shirt');
  }

  if (show.gifts && (inv.gifts?.note || inv.gifts?.items?.length)) {
    const items = (inv.gifts.items || []).filter((g) => g.label || g.detail).map((g) => {
      const url = safeUrl(g.detail);
      return `<div class="gift"><strong>${esc(g.label)}</strong>${url
        ? `<a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">${tr('Ver mesa de regalos')}</a>`
        : `<span class="gift-detail">${esc(g.detail)}</span>${g.detail ? `<button class="btn ghost small copy" type="button" data-copy="${esc(g.detail)}">${tr('Copiar')}</button>` : ''}`}</div>`;
    }).join('');
    S.gifts = section('gifts', tr('Regalos'), `${inv.gifts.note ? `<p>${esc(inv.gifts.note)}</p>` : ''}<div class="gifts">${items}</div>`, 'gift');
  }

  if (show.gallery && inv.gallery?.length) {
    const imgs = inv.gallery.map((u) => safeUrl(u, { image: true })).filter(Boolean);
    if (imgs.length) S.gallery = section('gallery', tr('Galería'), `<div class="gallery">${imgs.map((u) => `<img src="${esc(u)}" alt="" loading="lazy">`).join('')}</div>`, 'heart');
  }

  if (show.playlist && inv.spotify) {
    const sp = spotifyEmbed(inv.spotify);
    if (sp) S.playlist = section('playlist', tr('Nuestra playlist'), `<iframe class="spotify" src="${esc(sp.src)}" height="${sp.height}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="Spotify"></iframe>`, 'music');
  }

  if (show.calendar && dt) {
    S.calendar = `<section class="sec reveal center" id="sec-calendar" data-edit="evento"><div class="btn-row">
      <a class="btn" id="gcal" target="_blank" rel="noopener">${tr('Agregar a Google Calendar')}</a>
      <button class="btn ghost" id="ics" type="button">${tr('Descargar evento (.ics)')}</button>
    </div></section>`;
  }

  if (show.rsvp) {
    const deadline = inv.rsvp?.deadline ? parseDate(inv.rsvp.deadline) : null;
    const hasPhone = !!(inv.rsvp?.phone || '').replace(/\D/g, '');
    S.rsvp = section('rsvp', tr('Confirma tu asistencia'), `
      ${deadline ? `<p>${tr('Por favor confirma antes del')} <strong>${esc(fmtDateL(deadline, L))}</strong></p>` : ''}
      ${inv.rsvp?.note ? `<p class="muted">${esc(inv.rsvp.note)}</p>` : ''}
      ${rsvpForm(inv, guest, hasPhone, tr)}`, 'heart');
  }

  for (const k of sectionOrder(inv)) if (S[k]) parts.push(S[k]);

  // Créditos de fotos y música libres (las licencias Creative Commons lo piden)
  const usedMedia = [cover, ...(show.gallery ? inv.gallery || [] : []), inv.music].filter(Boolean);
  const seen = new Set();
  const credits = usedMedia.map((u) => inv.credits?.[u]).filter((c) => c && c.id && !seen.has(c.id) && seen.add(c.id));
  const creditsHtml = credits.length
    ? `<p class="credits">${credits.map((c) => `${c.kind === 'audio' ? '♪' : '📷'} <a href="${esc(creditLink(c))}" target="_blank" rel="noopener">${esc(c.title || c.by)}${c.title ? ' · ' + esc(c.by) : ''}</a> (${esc(c.lic)})`).join(' · ')}</p>`
    : '';
  parts.push(`<footer class="foot">${div}<p class="names small">${esc(ev.names)}</p>${creditsHtml}<p class="made">${tr('Hecho con')} <a href="./" target="_blank">CoroLink</a> · ${tr('gratis')}</p></footer>`);

  return `<div class="inv layout-${esc(t.layout)} pattern-${esc(t.pattern || 'none')}">${parts.join('')}</div>`;
}

// Formulario de confirmación según lo que configuró el anfitrión
export function rsvpFields(inv) {
  return { ...defaultRsvpFields(), ...(inv.rsvp?.fields || {}) };
}
function rsvpForm(inv, guest, hasPhone, tr) {
  const F = rsvpFields(inv);
  const lvl = (k) => (['off', 'opt', 'req'].includes(F[k]) ? F[k] : 'off');
  const req = (k) => (lvl(k) === 'req' ? 'required' : '');
  const lab = (k, text) => `${esc(text)}${lvl(k) === 'opt' ? ` <small>${tr('(opcional)')}</small>` : ''}`;
  const max = guest.passes || 20;
  const rows = [];
  rows.push(`<label>${tr('Tu nombre')}<input name="name" required maxlength="80" value="${esc(guest.name || '')}" autocomplete="name"></label>`);
  rows.push(`<div class="seg" role="radiogroup" aria-label="${tr('¿Asistirás?')}">
      <label><input type="radio" name="go" value="si" checked><span>${tr('¡Sí, ahí estaré!')}</span></label>
      <label><input type="radio" name="go" value="no"><span>${tr('No podré ir')}</span></label>
    </div>`);
  const yes = [];
  if (lvl('phone') !== 'off') rows.push(`<label>${lab('phone', tr('Tu teléfono'))}<input name="phone" type="tel" inputmode="tel" maxlength="20" ${req('phone')} autocomplete="tel"></label>`);
  if (lvl('count') !== 'off') yes.push(`<label>${lab('count', guest.passes ? tr('¿Cuántos van? (tienes {n})', { n: guest.passes }) : tr('¿Cuántas personas van?'))}<input name="n" type="number" min="1" max="${max}" value="${guest.passes || 1}" ${req('count')}></label>`);
  if (lvl('companions') !== 'off') yes.push(`<label>${lab('companions', tr('Nombres de tus acompañantes'))}<input name="companions" maxlength="200" placeholder="${tr('Separados por coma')}" ${req('companions')}></label>`);
  if (lvl('diet') !== 'off') yes.push(`<label>${lab('diet', tr('Alergias o restricciones de comida'))}<input name="diet" maxlength="120" placeholder="${tr('Vegetariano, sin gluten…')}" ${req('diet')}></label>`);
  if (lvl('song') !== 'off') yes.push(`<label>${lab('song', tr('Canción que no puede faltar'))}<input name="song" maxlength="100" ${req('song')}></label>`);
  if (lvl('custom') !== 'off' && F.customQ) yes.push(`<label>${lab('custom', F.customQ)}<input name="custom" maxlength="200" ${req('custom')}></label>`);
  if (yes.length) rows.push(`<div class="if-yes">${yes.join('')}</div>`);
  if (lvl('msg') !== 'off') rows.push(`<label>${lab('msg', tr('Mensaje para los anfitriones'))}<textarea name="msg" rows="2" maxlength="400" placeholder="${tr('Unas palabras para los anfitriones')}" ${req('msg')}></textarea></label>`);
  rows.push(`<button class="btn wide" type="submit">${tr(hasPhone ? 'Confirmar por WhatsApp' : 'Confirmar')}</button>`);
  return `<form class="rsvp" id="rsvp-form" novalidate>${rows.join('')}</form>`;
}
export { RSVP_FIELDS };

export function envelopeHTML(inv, guest = {}) {
  const tr = (s) => ti(inv.lang === 'en' ? 'en' : 'es', s);
  return `<div class="envelope" id="envelope">
    <div class="env-wrap">
      ${guest.name ? `<p class="env-to">${tr('Para:')} <strong>${esc(guest.name)}</strong></p>` : ''}
      <div class="env-body">
        <div class="env-flap"></div>
        <div class="env-seal" aria-hidden="true">${esc((inv.ev.names || 'C').trim().charAt(0))}</div>
      </div>
      <div class="env-text">
        <p class="env-names">${esc(inv.ev.names)}</p>
        <button class="btn" id="env-open" type="button">${tr('Abrir invitación')}</button>
      </div>
    </div>
  </div>`;
}

// ---------- Calendario ----------
export function calendarLinks(inv) {
  const dt = parseDate(inv.ev.date, inv.ev.time);
  if (!dt) return null;
  const end = new Date(dt.getTime() + 5 * 3600e3);
  const f = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const place = inv.places?.[0] ? [inv.places[0].name, inv.places[0].addr].filter(Boolean).join(', ') : '';
  const title = [inv.ev.pre, inv.ev.names].filter(Boolean).join(' - ');
  const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(dt)}/${f(end)}&location=${encodeURIComponent(place)}&details=${encodeURIComponent(location.href)}`;
  const icsEsc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CoroLink//ES', 'BEGIN:VEVENT',
    `UID:${Date.now()}@corolink`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(dt)}`, `DTEND:${f(end)}`,
    `SUMMARY:${icsEsc(title)}`, `LOCATION:${icsEsc(place)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  return { google: g, ics };
}
