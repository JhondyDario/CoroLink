import { decodeData, parseHash } from './codec.js';
import { renderInvitation, envelopeHTML, applyThemeVars, ensureFonts, calendarLinks, waPhone, rsvpFields } from './render.js';

const app = document.getElementById('app');
const isPreview = new URLSearchParams(location.search).has('preview');
let current = null;
let countdownTimer = null;

function render(inv, guest, { envelope }) {
  current = { inv, guest };
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
      if (s === 0) cd.closest('.sec').querySelector('.sec-title').textContent = '¡Llegó el día!';
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
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '¡Copiado!'; } catch { b.textContent = 'No se pudo copiar'; }
    setTimeout(() => (b.textContent = 'Copiar'), 1600);
  }));

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
      const evName = `*${inv.ev.names || inv.ev.pre || 'tu evento'}*`;
      const lines = [yes
        ? `¡Hola! Soy *${val('name')}* ✅ Confirmo mi asistencia a ${evName}.`
        : `¡Hola! Soy *${val('name')}*. Lamentablemente no podré asistir a ${evName} 😔`];
      if (yes && F.count !== 'off') lines.push(`👥 Personas: *${n}*`);
      if (yes && val('companions')) lines.push(`👫 Acompañantes: ${val('companions')}`);
      if (val('phone')) lines.push(`📞 Teléfono: ${val('phone')}`);
      if (yes && val('diet')) lines.push(`🍽️ Comida: ${val('diet')}`);
      if (yes && val('song')) lines.push(`🎵 Canción: ${val('song')}`);
      if (yes && val('custom')) lines.push(`❓ ${F.customQ}: ${val('custom')}`);
      if (val('msg')) lines.push(`💬 ${val('msg')}`);
      // Código para que el gestor de invitados lo lea solo
      lines.push('', `CL|${guest.gid || '0'}|${yes ? 'si' : 'no'}|${n}`);
      const text = lines.join('\n');
      const url = `https://wa.me/${waPhone(inv.rsvp?.phone)}?text=${encodeURIComponent(text)}`;
      if (isPreview) { form.querySelector('button[type=submit]').textContent = 'Vista previa: aquí se abriría WhatsApp'; return; }
      window.open(url, '_blank', 'noopener');
      form.innerHTML = `<p class="thanks">${yes ? '¡Gracias por confirmar! 🎉' : 'Gracias por avisar 💛'}</p><p class="muted">Si WhatsApp no se abrió, <a href="${url}" target="_blank" rel="noopener">toca aquí</a>.</p>`;
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
  btn.innerHTML = '♪';
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
if (isPreview) {
  document.body.classList.add('preview');
  window.addEventListener('message', async (e) => {
    if (e.origin !== location.origin) return;
    const m = e.data || {};
    if (m.type === 'ping') e.source.postMessage({ type: 'preview-ready' }, e.origin);
    if (m.type === 'render') render(m.inv, m.guest || {}, { envelope: !!m.envelope });
    if (m.type === 'export-png') {
      try { e.source.postMessage({ type: 'png', data: await exportPng() }, e.origin); }
      catch (err) { e.source.postMessage({ type: 'png', error: String(err) }, e.origin); }
    }
  });
  parent.postMessage({ type: 'preview-ready' }, location.origin);
} else {
  const load = async () => {
    const { d, to, passes, gid, table } = parseHash();
    if (!d) {
      app.innerHTML = `<div class="empty"><h1>CoroLink</h1><p>Este link no tiene una invitación.</p><a class="btn" href="crear.html">Crear una gratis</a></div>`;
      return;
    }
    try {
      const inv = await decodeData(d);
      render(inv, { name: to, passes, gid, table }, { envelope: inv.theme?.envelope !== false });
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="empty"><h1>Ups</h1><p>El link está incompleto o dañado. Pídele a quien te invitó que te lo reenvíe.</p></div>`;
    }
  };
  window.addEventListener('hashchange', load);
  load();
}
