import { decodeData, parseHash } from './codec.js';
import { ti } from './i18n.js';
import { icon } from './icons.js';
// Idioma de la invitación abierta (los textos fijos salen en ese idioma)
let L = 'es';
const tr = (s, v) => ti(L, s, v);
import { renderInvitation, envelopeHTML, applyThemeVars, ensureFonts, calendarLinks, waPhone, rsvpFields } from './render.js';

const app = document.getElementById('app');
const isPreview = new URLSearchParams(location.search).has('preview');
let current = null;
let countdownTimer = null;

function render(inv, guest, { envelope }) {
  current = { inv, guest };
  L = inv.lang === 'en' ? 'en' : 'es';
  document.documentElement.lang = L;
  document.title = [inv.ev.pre, inv.ev.names].filter(Boolean).join(' · ') || 'Invitación';
  applyThemeVars(document.documentElement, inv.theme);
  ensureFonts(inv.theme);
  const y = window.scrollY;
  app.innerHTML = renderInvitation(inv, guest) + (envelope ? envelopeHTML(inv, guest) : '');
  document.body.classList.toggle('locked', !!envelope);
  wire(inv, guest);
  if (isPreview) window.scrollTo(0, y);
}

function wire(inv, guest) {
  // Sobre
  const env = document.getElementById('envelope');
  env?.querySelector('#env-open').addEventListener('click', () => {
    env.classList.add('open');
    document.body.classList.remove('locked');
    startMusic(inv);
    setTimeout(() => env.remove(), 1100);
  });
  if (!env) setupMusicButton(inv, false);

  // Cuenta regresiva
  clearInterval(countdownTimer);
  const cd = app.querySelector('.countdown');
  if (cd) {
    const target = +cd.dataset.target;
    const nums = cd.querySelectorAll('.cd-n');
    const tick = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const v = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
      nums.forEach((n, i) => (n.textContent = String(v[i]).padStart(2, '0')));
      if (s === 0) cd.closest('.sec').querySelector('.sec-title').textContent = tr('¡Llegó el día!');
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // Mapas bajo demanda (no cargamos iframes de Google hasta que el invitado los pida)
  app.querySelectorAll('.map-load').forEach((b) => b.addEventListener('click', () => {
    const box = b.parentElement;
    box.innerHTML = `<iframe src="${box.dataset.src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa"></iframe>`;
    box.classList.add('loaded');
  }));

  app.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = tr('¡Copiado!'); } catch { b.textContent = tr('No se pudo copiar'); }
    setTimeout(() => (b.textContent = tr('Copiar')), 1600);
  }));

  // Galería
  app.querySelectorAll('[data-gal="carousel"]').forEach(wireCarousel);
  app.querySelectorAll('[data-gal="stack"]').forEach(wireStack);

  // Calendario
  const cal = calendarLinks(inv);
  if (cal) {
    const g = document.getElementById('gcal');
    if (g) g.href = cal.google;
    document.getElementById('ics')?.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([cal.ics], { type: 'text/calendar' }));
      a.download = 'evento.ics';
      a.click();
    });
  }

  // RSVP
  const form = document.getElementById('rsvp-form');
  if (form) {
    const ifYes = form.querySelector('.if-yes');
    form.addEventListener('change', () => { if (ifYes) ifYes.hidden = form.go.value !== 'si'; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const yes = form.go.value === 'si';
      // Validamos sólo lo visible (si dice que no va, no pedimos acompañantes, etc.)
      for (const el of form.querySelectorAll('input, textarea')) {
        if (!yes && ifYes?.contains(el)) continue;
        if (!el.checkValidity()) { el.reportValidity(); return; }
      }
      const f = new FormData(form);
      const val = (k) => String(f.get(k) || '').trim();
      const F = rsvpFields(inv);
      const n = yes ? (F.count !== 'off' ? Math.max(1, parseInt(val('n'), 10) || 1) : guest.passes || 1) : 0;
      const evName = `*${inv.ev.names || inv.ev.pre || tr('tu evento')}*`;
      const lines = [yes
        ? tr('¡Hola! Soy *{name}* ✅ Confirmo mi asistencia a {ev}.', { name: val('name'), ev: evName })
        : tr('¡Hola! Soy *{name}*. Lamentablemente no podré asistir a {ev} 😔', { name: val('name'), ev: evName })];
      if (yes && F.count !== 'off') lines.push(tr('👥 Personas: *{n}*', { n }));
      if (yes && val('companions')) lines.push(tr('👫 Acompañantes: {v}', { v: val('companions') }));
      if (val('phone')) lines.push(tr('📞 Teléfono: {v}', { v: val('phone') }));
      if (yes && val('diet')) lines.push(tr('🍽️ Comida: {v}', { v: val('diet') }));
      if (yes && val('song')) lines.push(tr('🎵 Canción: {v}', { v: val('song') }));
      if (yes && val('custom')) lines.push(`❓ ${F.customQ}: ${val('custom')}`);
      if (val('msg')) lines.push(`💬 ${val('msg')}`);
      // Código para que el gestor de invitados lo lea solo
      lines.push('', `CL|${guest.gid || '0'}|${yes ? 'si' : 'no'}|${n}`);
      const text = lines.join('\n');
      const url = `https://wa.me/${waPhone(inv.rsvp?.phone)}?text=${encodeURIComponent(text)}`;
      if (isPreview) { form.querySelector('button[type=submit]').textContent = tr('Vista previa: aquí se abriría WhatsApp'); return; }
      window.open(url, '_blank', 'noopener');
      form.innerHTML = `<p class="thanks">${tr(yes ? '¡Gracias por confirmar! 🎉' : 'Gracias por avisar 💛')}</p><p class="muted">${tr('Si WhatsApp no se abrió,')} <a href="${url}" target="_blank" rel="noopener">${tr('toca aquí')}</a>.</p>`;
    });
  }

  // Animación al hacer scroll
  const io = new IntersectionObserver((ents) => ents.forEach((en) => en.isIntersecting && en.target.classList.add('in')), { threshold: 0.12 });
  app.querySelectorAll('.reveal').forEach((el) => (isPreview ? el.classList.add('in') : io.observe(el)));
}

// ---------- Música ----------
let audio = null;
function ytId(u) {
  const m = /(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/.exec(u || '');
  return m ? m[1] : null;
}
function startMusic(inv) {
  setupMusicButton(inv, true);
}
function setupMusicButton(inv, autoplay) {
  document.getElementById('music-btn')?.remove();
  document.getElementById('yt-holder')?.remove();
  audio?.pause();
  audio = null;
  const url = inv.music;
  if (!url || isPreview) return;
  const btn = document.createElement('button');
  btn.id = 'music-btn';
  btn.className = 'music-btn';
  btn.setAttribute('aria-label', 'Música');
  btn.innerHTML = icon('music', { size: 20 });
  document.body.appendChild(btn);
  const id = ytId(url);
  let playing = false;
  const set = (p) => { playing = p; btn.classList.toggle('on', p); };
  if (id) {
    const holder = document.createElement('div');
    holder.id = 'yt-holder';
    holder.className = 'yt-holder';
    document.body.appendChild(holder);
    const play = () => { holder.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}" allow="autoplay" title="Música"></iframe>`; set(true); };
    const stop = () => { holder.innerHTML = ''; set(false); };
    btn.onclick = () => (playing ? stop() : play());
    if (autoplay) play();
  } else if (/^https?:\/\//.test(url)) {
    audio = new Audio(url);
    audio.loop = true;
    btn.onclick = () => (playing ? (audio.pause(), set(false)) : audio.play().then(() => set(true)).catch(() => {}));
    if (autoplay) audio.play().then(() => set(true)).catch(() => {});
  }
}

// ---------- Exportar imagen (lo pide el editor) ----------
async function exportPng() {
  if (!window.htmlToImage) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/vendor/html-to-image.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const node = app.querySelector('.hero');
  if (!node) throw new Error('La vista previa no está lista');
  return window.htmlToImage.toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg') });
}

// ---------- Arranque ----------
// En la vista previa del editor: tocar una parte abre sus campos de edición
let editing = '';
function markEditing() {
  app.querySelectorAll('[data-edit]').forEach((el) => el.classList.toggle('editing', !!editing && el.dataset.edit === editing));
}
if (isPreview) {
  document.body.classList.add('preview');
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-edit]');
    if (!el || e.target.closest('#envelope')) return;
    // Las flechas y puntitos de la galería siguen funcionando para poder probarla
    if (!e.target.closest('.gal-nav, .gal-nav-s, [data-dot]')) {
      e.preventDefault();
      e.stopPropagation();
    }
    editing = el.dataset.edit;
    markEditing();
    parent.postMessage({ type: 'edit', group: editing }, location.origin);
  }, true);
  window.addEventListener('message', async (e) => {
    if (e.origin !== location.origin) return;
    const m = e.data || {};
    if (m.type === 'ping') e.source.postMessage({ type: 'preview-ready' }, e.origin);
    if (m.type === 'render') { render(m.inv, m.guest || {}, { envelope: !!m.envelope }); markEditing(); }
    if (m.type === 'editing') {
      editing = m.group || '';
      markEditing();
      if (editing && m.scroll) app.querySelector(`[data-edit="${CSS.escape(editing)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (m.type === 'export-png') {
      try { e.source.postMessage({ type: 'png', data: await exportPng() }, e.origin); }
      catch (err) { e.source.postMessage({ type: 'png', error: String(err) }, e.origin); }
    }
  });
  parent.postMessage({ type: 'preview-ready' }, location.origin);
} else {
  if (/^en/i.test(navigator.language || '')) L = 'en';
  const load = async () => {
    const { d, to, passes, gid, table } = parseHash();
    if (!d) {
      app.innerHTML = `<div class="empty"><h1>CoroLink</h1><p>${tr('Este link no tiene una invitación.')}</p><a class="btn" href="crear.html">${tr('Crear una gratis')}</a></div>`;
      return;
    }
    try {
      const inv = await decodeData(d);
      render(inv, { name: to, passes, gid, table }, { envelope: inv.theme?.envelope !== false });
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="empty"><h1>${tr('Ups')}</h1><p>${tr('El link está incompleto o dañado. Pídele a quien te invitó que te lo reenvíe.')}</p></div>`;
    }
  };
  window.addEventListener('hashchange', load);
  load();
}

// ---------- Galería: carrusel ----------
function wireCarousel(box) {
  const track = box.querySelector('.gal-track');
  const dots = [...box.querySelectorAll('[data-dot]')];
  const go = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  const cur = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  box.querySelector('.prev')?.addEventListener('click', () => go(Math.max(0, cur() - 1)));
  box.querySelector('.next')?.addEventListener('click', () => go(cur() + 1 >= dots.length ? 0 : cur() + 1));
  dots.forEach((d) => d.addEventListener('click', () => go(+d.dataset.dot)));
  track.addEventListener('scroll', () => { const i = cur(); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
}

// ---------- Galería: tarjetas para deslizar (como Tinder) ----------
function wireStack(box) {
  const cards = [...box.querySelectorAll('.gal-card')];
  const count = box.querySelector('.gal-count');
  let order = cards.map((_, i) => i); // order[0] es la tarjeta de arriba
  let seen = 0;
  const layout = () => {
    order.forEach((ci, k) => {
      const c = cards[ci];
      c.style.zIndex = String(cards.length - k);
      c.style.transform = k < 3 ? `translateY(${k * 10}px) scale(${1 - k * 0.05}) rotate(${k ? (k % 2 ? 2.5 : -2.5) : 0}deg)` : 'translateY(20px) scale(.9)';
      c.style.opacity = k < 3 ? '1' : '0';
      c.classList.toggle('top', k === 0);
    });
    if (count) count.textContent = `${(seen % cards.length) + 1} / ${cards.length}`;
  };
  const fly = (dir) => {
    if (cards.length < 2) return;
    const top = cards[order[0]];
    top.style.transition = 'transform .35s ease, opacity .35s ease';
    top.style.transform = `translateX(${dir * 130}%) rotate(${dir * 22}deg)`;
    top.style.opacity = '0';
    setTimeout(() => {
      order = [...order.slice(1), order[0]];
      seen++;
      top.style.transition = 'none';
      layout();
      requestAnimationFrame(() => { top.style.transition = ''; });
    }, 300);
  };
  const back = () => {
    if (cards.length < 2) return;
    order = [order.at(-1), ...order.slice(0, -1)];
    seen = (seen - 1 + cards.length) % cards.length;
    layout();
  };
  box.querySelector('.next')?.addEventListener('click', () => fly(1));
  box.querySelector('.prev')?.addEventListener('click', back);
  // Arrastrar con el dedo o el mouse
  let drag = null;
  box.querySelector('.gal-cards').addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.gal-card.top');
    if (!c || cards.length < 2) return;
    drag = { c, x: e.clientX, dx: 0 };
    c.setPointerCapture(e.pointerId);
    c.style.transition = 'none';
  });
  box.querySelector('.gal-cards').addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    drag.c.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 18}deg)`;
  });
  const end = () => {
    if (!drag) return;
    const { c, dx } = drag;
    drag = null;
    c.style.transition = '';
    if (Math.abs(dx) > 80) fly(dx > 0 ? 1 : -1); else layout();
  };
  box.querySelector('.gal-cards').addEventListener('pointerup', end);
  box.querySelector('.gal-cards').addEventListener('pointercancel', end);
  layout();
}
