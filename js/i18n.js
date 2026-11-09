// Idiomas. El español es el idioma principal: el texto en español ES la clave.
// Si falta una traducción, simplemente se queda en español.
//  - t('texto', {vars})       traduce un texto de la interfaz
//  - ti(lang, 'texto', vars)  traduce un texto de la invitación (cada invitación tiene su idioma)
//  - startI18n()              traduce el HTML de la página y lo que se vaya agregando

const KEY = 'corolink.lang';
const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
export const LANGS = { es: 'Español', en: 'English' };
export const lang = LANGS[saved] ? saved : 'es';
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* sin almacenamiento */ }
  location.reload();
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s);
const norm = (s) => s.replace(/\s+/g, ' ').trim();

export function t(s, vars) {
  return fill(lang === 'en' ? EN[norm(s)] ?? s : s, vars);
}
export function ti(l, s, vars) {
  return fill(l === 'en' ? EN[norm(s)] ?? s : s, vars);
}

// ---------- Traducción automática del HTML ----------
const ATTRS = ['placeholder', 'title', 'aria-label'];
function translateNode(node) {
  if (node.nodeType === 3) {
    const raw = node.nodeValue;
    const k = norm(raw);
    if (k && EN[k] && k !== EN[k] && raw.trim() !== EN[k]) node.nodeValue = raw.replace(raw.trim(), EN[k]);
    return;
  }
  if (node.nodeType !== 1 || node.closest?.('[data-noi18n]')) return;
  if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE' || node.tagName === 'IFRAME') return;
  translateAttrs(node);
  node.childNodes.forEach(translateNode);
}
// Sólo se escribe si el texto cambia: si no, el observador vería su propio cambio y no pararía nunca
function translateAttrs(node) {
  for (const a of ATTRS) {
    const v = node.getAttribute?.(a);
    const tr = v && EN[norm(v)];
    if (tr && tr !== v) node.setAttribute(a, tr);
  }
}
export function startI18n() {
  document.documentElement.lang = lang;
  if (lang !== 'en') return;
  if (EN[norm(document.title)]) document.title = EN[norm(document.title)];
  translateNode(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') translateNode(m.target);
      else if (m.type === 'attributes') { if (!m.target.closest?.('[data-noi18n]')) translateAttrs(m.target); }
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

// Botón ES / EN
export function langSwitch() {
  const other = lang === 'es' ? 'en' : 'es';
  return `<button class="btn ghost sm lang-btn" type="button" data-setlang="${other}" title="${other === 'en' ? 'English' : 'Español'}" aria-label="${other === 'en' ? 'Switch to English' : 'Cambiar a español'}">${other.toUpperCase()}</button>`;
}
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-setlang]');
    if (b) setLang(b.dataset.setlang);
  });
}

// ---------- Fechas y horas ----------
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export function fmtDateL(dt, l = 'es') {
  if (!dt) return '';
  if (l === 'en') return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(dt);
  const d = DIAS[dt.getDay()];
  return `${d[0].toUpperCase() + d.slice(1)} ${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`;
}
export function fmtTimeL(time, l = 'es') {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1, mm = String(m).padStart(2, '0');
  return l === 'en' ? `${h12}:${mm} ${h >= 12 ? 'PM' : 'AM'}` : `${h12}:${mm} ${h >= 12 ? 'p.m.' : 'a.m.'}`;
}

// ---------- Diccionario español → inglés ----------
export const EN = {
  // Generales
  'Guardado': 'Saved', 'Guardando…': 'Saving…', 'Cerrar': 'Close', 'Cerrar panel': 'Close panel', 'Abrir': 'Open', 'Copiar': 'Copy', 'Quitar': 'Remove',
  'Agregar': 'Add', 'Editar': 'Edit', 'Eliminar': 'Delete', 'Listo': 'Done', 'Buscar': 'Search', 'Filtrar': 'Filter', 'Todos': 'All', 'Todas': 'All',
  'Importar': 'Import', 'Nombre': 'Name', 'Mensaje': 'Message', 'Nota': 'Note', 'Fecha': 'Date', 'Hora': 'Time', 'Grupo': 'Group', 'Pases': 'Passes',
  'Ejemplo': 'Example', 'Invitación': 'Invitation', 'Invitados': 'Guests', 'Enviar': 'Send', 'PC': 'Desktop', 'Celular': 'Phone', 'Sobre': 'Envelope',
  'Link copiado': 'Link copied', 'Amigos': 'Friends',

  // Portada
  'CoroLink · Invitaciones digitales gratis': 'CoroLink · Free digital invitations',
  'Crear invitación': 'Create invitation', 'Invitaciones digitales': 'Digital invitations', 'bonitas y gratis': 'beautiful and free',
  'Diseña la invitación de tu boda, XV, cumpleaños, torneo gamer o lo que sea desde el celular o la PC. Envíala por WhatsApp y recibe las confirmaciones al instante. Sin cuentas, sin pagar, sin anuncios.':
    'Design the invitation for your wedding, quinceañera, birthday, gaming tournament or anything else from your phone or computer. Send it on WhatsApp and get RSVPs instantly. No accounts, no fees, no ads.',
  'Crear mi invitación': 'Create my invitation', 'Ver plantillas': 'See templates',
  '✓ 100% gratis': '✓ 100% free', '✓ Sin registro': '✓ No sign-up', '✓ Confirmación por WhatsApp': '✓ RSVP via WhatsApp', '✓ Código abierto': '✓ Open source',
  'Mis invitaciones': 'My invitations', 'Guardadas en este navegador.': 'Saved in this browser.', 'Plantillas': 'Templates',
  'Escoge una y cámbiale todo: colores, letras, decoración, textos. También puedes crear las tuyas.': 'Pick one and change everything: colors, fonts, decorations, text. You can also make your own.',
  'Todo lo que necesita tu evento': 'Everything your event needs', 'Lo mismo que las plataformas de pago, sin pagar.': 'What paid platforms offer, without paying.',
  'Sobre animado': 'Animated envelope', 'Tus invitados abren un sobre con su nombre y suena tu canción.': 'Guests open an envelope with their name on it while your song plays.',
  'Confirmación (RSVP)': 'RSVP', 'Confirman con un toque y te llega el mensaje directo a tu WhatsApp.': 'Guests confirm with one tap and the message lands in your WhatsApp.',
  'Gestor de invitados': 'Guest manager', 'Links con nombre, pases y mesa. Confirmaciones automáticas, recordatorios y exportación a CSV.': 'Links with name, passes and table. Automatic RSVPs, reminders and CSV export.',
  'Sala virtual': 'Virtual floor plan', 'Arma el plano del salón, sienta a tus invitados y mira en vivo quién va llegando.': 'Lay out the venue, seat your guests and watch arrivals live.',
  'Formulario a tu medida': 'Custom RSVP form', 'Tú decides qué piden al confirmar: acompañantes, alergias, canción favorita o tu propia pregunta.': 'You choose what guests fill in: plus-ones, allergies, a song request or your own question.',
  'Mapa y cómo llegar': 'Map and directions', 'Google Maps y Waze con un toque, para ceremonia y recepción.': 'Google Maps and Waze in one tap, for ceremony and reception.',
  'Cuenta regresiva': 'Countdown', 'Días, horas y minutos para el gran día.': 'Days, hours and minutes to the big day.',
  'Agregar al calendario': 'Add to calendar', 'Google Calendar o archivo .ics para iPhone y Outlook.': 'Google Calendar or an .ics file for iPhone and Outlook.',
  'Regalos y vestimenta': 'Gifts and dress code', 'Mesa de regalos, cuentas para transferencia y código de vestimenta.': 'Gift registry, bank details and dress code.',
  'QR e imagen': 'QR and image', 'Descarga el QR para imprimir y la portada como imagen para tus estados.': 'Download the QR code to print and the cover as an image for your stories.',
  '¿Cómo funciona?': 'How does it work?', 'Tu invitación vive dentro del link. No la guardamos en ningún servidor, por eso es gratis para siempre.': 'Your invitation lives inside the link. We don\'t store it on any server, which is why it\'s free forever.',
  'Escoge una plantilla': 'Pick a template', 'Bodas, XV, cumpleaños, bautizos, graduaciones y más.': 'Weddings, quinceañeras, birthdays, baptisms, graduations and more.',
  'Personalízala': 'Make it yours', 'Textos, fotos, colores, lugares, itinerario y música.': 'Text, photos, colors, venues, schedule and music.',
  'Agrega invitados': 'Add guests', 'Pega tu lista y cada quien recibe su link con su nombre.': 'Paste your list and everyone gets a link with their name.',
  'Envía y recibe': 'Send and receive', 'Manda por WhatsApp y te llegan las confirmaciones.': 'Send it on WhatsApp and RSVPs come back to you.',
  'Familia Pérez': 'The Pérez family', '⭐ Danos una estrella': '⭐ Give us a star', '🐞 Reportar un problema': '🐞 Report a problem', '💡 Sugerir una mejora': '💡 Suggest an improvement', '{n} invitados': '{n} guests', 'Español': 'Español', 'English': 'English',
  'Duplicar': 'Duplicate', 'Hacer plantilla': 'Make template', 'Borrar': 'Delete',
  '¿Borrar esta invitación de este navegador? Los links que ya enviaste siguen funcionando.': 'Delete this invitation from this browser? Links you already sent will keep working.',
  'Invitación duplicada (sin la lista de invitados)': 'Invitation duplicated (without the guest list)',
  'Plantilla guardada con diseño y contenido': 'Template saved with design and content',
  'Alternativa open source y 100% gratis a las apps de invitaciones de pago.': 'An open-source, 100% free alternative to paid invitation apps.',
  'Código abierto en GitHub': 'Open source on GitHub', 'Danos una estrella': 'Give us a star', 'Reportar un problema': 'Report a problem', 'Sugerir una mejora': 'Suggest an improvement',
  'Hecho en RD 🇩🇴 · Licencia MIT': 'Made in the Dominican Republic 🇩🇴 · MIT License',
  'Modo oscuro': 'Dark mode', 'Modo claro': 'Light mode', 'Cambiar tema': 'Toggle theme',
  '¿Problema o idea?': 'Problem or idea?', 'Ayúdanos a mejorar': 'Help us improve',

  // Plantillas y filtros
  '★ Favoritas': '★ Favorites', 'Mis plantillas': 'My templates', 'Con contenido': 'With content', 'Agregar a favoritas': 'Add to favorites', 'Quitar de favoritas': 'Remove from favorites',
  'Agregada a favoritas ★': 'Added to favorites ★', 'Quitada de favoritas': 'Removed from favorites', 'No hay plantillas aquí.': 'No templates here.',
  'Amor': 'Love', 'Familia': 'Family', 'Gamer y tech': 'Gaming & tech', 'Fiestas': 'Parties', 'Profesional': 'Professional',
  'Boda': 'Wedding', 'Aniversario': 'Anniversary', 'Despedida': 'Bachelor(ette)', 'XV Años': 'Quinceañera', 'Cumpleaños': 'Birthday', 'Baby shower': 'Baby shower',
  'Bautizo': 'Baptism', 'Graduación': 'Graduation', 'Bienvenida': 'Welcome home', 'Reencuentro': 'Reunion', 'Cena familiar': 'Family dinner',
  'Torneo / eSports': 'Tournament / eSports', 'LAN party': 'LAN party', 'Lanzamiento de juego': 'Game launch', 'Watch party': 'Watch party', 'Rol / juegos de mesa': 'RPG / board games',
  'Fiesta': 'Party', 'Halloween / disfraces': 'Halloween / costume', 'Año Nuevo': 'New Year', 'Junte / BBQ': 'BBQ / hangout', 'Pool party': 'Pool party', 'Open house': 'Open house',
  'Corporativo': 'Corporate', 'Lanzamiento de producto': 'Product launch', 'Taller': 'Workshop', 'Conferencia': 'Conference', 'Meetup': 'Meetup', 'Evento benéfico': 'Charity event',
  'Jardín': 'Garden', 'Noche dorada': 'Golden night', 'Minimal': 'Minimal', 'Mariposas': 'Butterflies', 'Noche estrellada': 'Starry night', 'Globos': 'Balloons',
  'Dulce espera': 'Sweet wait', 'Navidad': 'Christmas', 'Nuestro aniversario': 'Our anniversary', 'Última noche': 'Last night out', '¡Bienvenido!': 'Welcome!',
  'Cena en familia': 'Family dinner', 'Torneo eSports': 'eSports tournament', 'Launch party': 'Launch party', 'Noche de rol': 'RPG night', 'Lanzamiento': 'Launch',

  // Editor: pestañas y diseño
  'Crear invitación · CoroLink': 'Create invitation · CoroLink', 'Plantilla': 'Template', 'Diseño': 'Design', 'Contenido': 'Content', 'Secciones': 'Sections',
  'Escoge un punto de partida. Cambiar de plantilla sólo cambia el diseño: tu texto se queda. Toca ☆ para guardarla en favoritas.': 'Pick a starting point. Switching templates only changes the design: your text stays. Tap ☆ to save it to favorites.',
  '¿Te gustó cómo quedó una invitación? En': 'Love how an invitation turned out? Use', 'Enviar → Guardar como plantilla': 'Send → Save as template',
  'la conviertes en plantilla para tus próximos eventos.': 'to turn it into a template for future events.',
  'Importar plantilla (.json)': 'Import template (.json)', 'Estilo': 'Style', 'Decoración': 'Decoration', 'Colores': 'Colors', 'Fondo': 'Background',
  'Tarjeta': 'Card', 'Texto': 'Text', 'Principal': 'Main', 'Acento': 'Accent', 'Tipografía': 'Typography', 'Títulos': 'Headings',
  'Abrir con animación de sobre': 'Open with envelope animation', 'Hazla tu plantilla': 'Make it your template',
  'Guarda este diseño para reusarlo o compártelo como archivo con otra gente.': 'Save this design to reuse it, or share it as a file with others.',
  'Guardar como plantilla': 'Save as template', 'Exportar .json': 'Export .json',
  'Clásico': 'Classic', 'Moderno': 'Modern', 'Elegante': 'Elegant', 'Neón': 'Neon', 'Liso': 'Plain', 'Puntos': 'Dots', 'Líneas': 'Lines', 'Papel': 'Paper',
  'Floral': 'Floral', 'Art déco': 'Art deco', 'Hojas': 'Leaves', 'Confeti': 'Confetti', 'Estrellas': 'Stars', 'Pixel': 'Pixel', 'Circuito': 'Circuit', 'Dados': 'Dice',
  'Murciélagos': 'Bats', 'Fuegos artificiales': 'Fireworks', 'Sol y olas': 'Sun & waves', 'Ninguna': 'None',
  'cursiva': 'script', 'serif': 'serif', 'sans': 'sans', 'divertida': 'fun', 'pixel': 'pixel', 'tech': 'tech', 'impacto': 'display', 'terror': 'horror', 'fantasía': 'fantasy',

  // Editor: contenido
  'Evento': 'Event', 'Tipo de evento': 'Event type', 'Idioma de la invitación': 'Invitation language', 'Frase de arriba': 'Top line', 'Nos casamos': 'We\'re getting married',
  'Nombres / título': 'Names / title', 'Frase o cita (opcional)': 'Quote (optional)', 'Foto de portada': 'Cover photo',
  'Pega el link de una imagen o súbela. Si la subes, la comprimimos y va dentro del link (lo hace más largo).': 'Paste an image link or upload one. Uploaded photos are compressed and stored inside the link (which makes it longer).',
  'Link de la imagen': 'Image link', 'Subir foto': 'Upload photo', 'Lugares': 'Venues', '+ Agregar lugar': '+ Add venue', 'Itinerario': 'Schedule', '+ Agregar momento': '+ Add item',
  'Vestimenta': 'Dress code', 'Código': 'Code', 'Formal, Cóctel, Blanco total…': 'Formal, Cocktail, All white…', 'Evitar el color blanco': 'Please avoid white',
  'Regalos': 'Gifts', '+ Agregar opción': '+ Add option', 'Galería': 'Gallery', 'Link de imagen https://…': 'Image link https://…', 'Subir fotos': 'Upload photos',
  'Música': 'Music', 'Link de YouTube o de un .mp3': 'YouTube or .mp3 link', 'Empieza a sonar cuando el invitado abre el sobre.': 'Starts playing when the guest opens the envelope.',
  'Tu WhatsApp (ahí te llegan las confirmaciones)': 'Your WhatsApp (RSVPs arrive here)', 'Confirmar antes del': 'RSVP by', 'Evento sólo para adultos': 'Adults only',
  '¿Qué debe llenar quien confirma?': 'What should guests fill in?', 'El nombre siempre se pide.': 'Name is always required.', 'Tu pregunta': 'Your question', '¿Necesitas transporte?': 'Do you need a ride?',
  'No': 'No', 'Opcional': 'Optional', 'Obligatorio': 'Required',
  'Teléfono': 'Phone', 'Número de personas': 'Number of people', 'Nombres de acompañantes': 'Plus-one names', 'Alergias o restricciones de comida': 'Allergies or dietary needs',
  'Canción que no puede faltar': 'Song request', 'Mensaje para los anfitriones': 'Message for the hosts', 'Pregunta personalizada': 'Custom question',
  'Título (Ceremonia, Recepción…)': 'Title (Ceremony, Reception…)', 'Nombre del lugar': 'Venue name', 'Dirección': 'Address', '¿Qué pasa?': 'What happens?',
  'Título (Transferencia, Mesa de regalos…)': 'Title (Bank transfer, Registry…)', 'Cuenta, número o link': 'Account, number or link', 'Subir': 'Move up', 'Bajar': 'Move down',
  'Foto agregada': 'Photo added', 'Pega un link que empiece con https://': 'Paste a link that starts with https://', '(foto subida)': '(uploaded photo)',

  // Editor: secciones
  'Arrastra para ordenar las secciones. Prende o apaga lo que aparece en la invitación.': 'Drag to reorder sections. Turn on or off what shows in the invitation.',
  'Mensaje de bienvenida': 'Welcome message', 'Playlist de Spotify ': 'Spotify playlist', 'Lugares y mapa': 'Venues and map', 'Galería de fotos': 'Photo gallery', 'Confirmación de asistencia': 'RSVP',
  'Mostrar su mesa al invitado': 'Show guests their table', 'Arrastrar para mover': 'Drag to move', 'La portada siempre va primero.': 'The cover always comes first.',

  // Editor: invitados y enviar
  'Tu lista, las confirmaciones, las mesas y el check-in del día del evento están en el gestor.': 'Your list, RSVPs, tables and event-day check-in live in the guest manager.',
  'Abrir gestor de invitados': 'Open guest manager', 'Links personales con nombre, pases y mesa': 'Personal links with name, passes and table',
  'Confirmaciones automáticas al pegar los mensajes de WhatsApp': 'Automatic RSVPs by pasting WhatsApp messages', 'Sala virtual: arma las mesas y sienta a tus invitados': 'Floor plan: set up tables and seat guests',
  'Check-in: mira en vivo quién va llegando y dónde se sienta': 'Check-in: see who arrives and where they sit, live',
  'invitaciones': 'invitations', 'personas': 'people', 'confirmados': 'confirmed', 'pendientes': 'pending',
  'Agrega al menos un invitado para enviar.': 'Add at least one guest to send.', 'Así cada quien recibe su link con su nombre y puedes llevar el control de quién confirma.': 'That way everyone gets a link with their name and you can track who confirms.',
  'Ir al gestor de invitados': 'Go to guest manager', 'Link general': 'General link', 'Para grupos o redes. Quien lo abra confirma escribiendo su nombre.': 'For groups or social media. Whoever opens it confirms by typing their name.',
  'Enviar por WhatsApp': 'Send on WhatsApp', 'Compartir…': 'Share…', 'Código QR': 'QR code', 'Para imprimir en tarjetas o poner en la mesa.': 'To print on cards or place on tables.',
  'Descargar QR': 'Download QR', 'Imagen': 'Image', 'Descarga la portada como imagen para estados de WhatsApp o Instagram.': 'Download the cover as an image for WhatsApp or Instagram stories.',
  'Descargar imagen': 'Download image', 'Respaldo': 'Backup', 'Duplicar invitación': 'Duplicate invitation', 'Exportar invitación': 'Export invitation',
  'Link de {kb} KB: muy largo. Quita fotos subidas y usa links de imagen.': '{kb} KB link: too long. Remove uploaded photos and use image links.',
  'Link de {kb} KB. Funciona en WhatsApp, pero es muy largo para QR (quita fotos subidas para el QR).': '{kb} KB link. Works on WhatsApp, but too long for a QR code (remove uploaded photos for QR).',
  'Link de {kb} KB. Perfecto 👌': '{kb} KB link. Perfect 👌', 'El link es muy largo para un QR.': 'The link is too long for a QR code.',
  'No se pudo generar el QR (¿sin internet?).': 'Couldn\'t generate the QR code (offline?).', 'Generando imagen…': 'Generating image…',
  'No se pudo generar la imagen. Si usas links de imagen externos, prueba subiendo la foto.': 'Couldn\'t generate the image. If you use external image links, try uploading the photo instead.',
  '¡Estás invitado! 💌': 'You\'re invited! 💌', 'Invitación cargada para editar': 'Invitation loaded for editing', 'No se pudo leer ese link': 'Couldn\'t read that link',
  'Ese archivo no es una invitación de CoroLink': 'That file isn\'t a CoroLink invitation', 'Ese archivo no es una plantilla de CoroLink': 'That file isn\'t a CoroLink template',
  'Plantilla importada': 'Template imported', 'Plantilla "{name}" aplicada': 'Template "{name}" applied',
  'Nombre para tu plantilla:': 'Name for your template:', '¿Borrar esta plantilla?': 'Delete this template?',
  '¿Incluir también el contenido? (textos, lugares, itinerario, vestimenta, regalos, formulario…)\n\nAceptar = diseño y contenido\nCancelar = sólo el diseño': 'Include the content too? (text, venues, schedule, dress code, gifts, RSVP form…)\n\nOK = design and content\nCancel = design only',
  'No se pudo guardar (¿fotos muy pesadas?)': 'Couldn\'t save (photos too large?)', 'Guardada con diseño y contenido en "Mis plantillas"': 'Saved with design and content in "My templates"',
  'Diseño guardado en "Mis plantillas"': 'Design saved in "My templates"', 'Copia creada. Abriéndola…': 'Copy created. Opening it…', 'No se pudo duplicar': 'Couldn\'t duplicate',
  'Vista previa': 'Preview', 'Sin invitado': 'No guest', 'Toca cualquier parte de la invitación para editarla': 'Tap any part of the invitation to edit it',
  'Editar sección': 'Edit section', 'Mostrar en la invitación': 'Show in invitation', 'Editando a la derecha ›': 'Editing on the right ›',
  'Hola {nombre} 💌 Te tenemos una invitación especial. Ábrela aquí:\n{link}': 'Hi {nombre} 💌 We have a special invitation for you. Open it here:\n{link}',
  'Hola {nombre} 👋 Te recordamos confirmar tu asistencia. Aquí está tu invitación:\n{link}': 'Hi {nombre} 👋 Just a reminder to RSVP. Here\'s your invitation:\n{link}',

  // Gestor
  'Gestor de invitados · CoroLink': 'Guest manager · CoroLink', 'Editar invitación': 'Edit invitation', 'Lista': 'List', 'Confirmaciones': 'RSVPs', 'Sala': 'Floor plan', 'Check-in': 'Check-in',
  'Agregar invitado': 'Add guest', 'Familia Rodríguez': 'The Smith family', 'WhatsApp (opcional)': 'WhatsApp (optional)', 'Pegar una lista': 'Paste a list',
  'Uno por línea:': 'One per line:', 'Nombre, pases, teléfono, grupo': 'Name, passes, phone, group', 'Agregar lista': 'Add list', 'Mensajes de WhatsApp': 'WhatsApp messages',
  'Recordatorio': 'Reminder', 'Usa': 'Use', 'y': 'and', 'Buscar invitado…': 'Search guest…', 'Buscar invitado': 'Search guest', 'Pendientes': 'Pending', 'Confirmados': 'Confirmed',
  'No van': 'Not going', 'Sin enviar': 'Not sent', 'Sin mesa': 'No table', 'Todos los grupos': 'All groups', 'Recordar a pendientes': 'Remind pending',
  'Descargar CSV': 'Download CSV', 'Todavía no hay invitados. Agrega el primero a la izquierda.': 'No guests yet. Add the first one on the left.',
  'Cargar confirmaciones': 'Load RSVPs', 'Cada confirmación que te llega por WhatsApp trae un código (': 'Every RSVP you get on WhatsApp includes a code (',
  '). Copia y pega aquí los mensajes, uno o muchos juntos, y se marcan solos.': '). Paste the messages here, one or many at once, and they\'re marked automatically.',
  'Pega aquí los mensajes de WhatsApp…': 'Paste WhatsApp messages here…', 'Procesar': 'Process', 'Subir chat exportado (.txt)': 'Upload exported chat (.txt)',
  'En WhatsApp: abre el chat › ⋮ › Más › Exportar chat › Sin archivos.': 'In WhatsApp: open the chat › ⋮ › More › Export chat › Without media.',
  'Respuestas': 'Responses', '+ Mesa redonda': '+ Round table', '+ Mesa larga': '+ Long table', '+ Zona (pista, tarima…)': '+ Area (dance floor, stage…)',
  'Sentar automáticamente': 'Auto-seat', 'Esperando llegadas…': 'Waiting for arrivals…', 'Pantalla completa': 'Full screen', '¿Quién llegó? Busca su nombre…': 'Who arrived? Search their name…',
  'invitaciones ': 'invitations', 'personas invitadas': 'people invited', 'no van': 'not going', 'enviadas': 'sent', 'han llegado': 'arrived',
  'Pendiente': 'Pending', 'Confirmado': 'Confirmed', 'No va': 'Not going', 'Recordar': 'Remind', 'Link': 'Link', 'enviada': 'sent',
  'Estado': 'Status', 'Personas que van': 'People attending', 'Mesa': 'Table', 'Nota privada': 'Private note', 'Enviada': 'Sent',
  'Acompañantes': 'Plus-ones', 'Comida': 'Food', 'Canción': 'Song', 'Respuesta': 'Answer',
  'Salón': 'Venue', 'Toca una mesa para editarla o arrástrala para moverla.': 'Tap a table to edit it, or drag it to move it.', 'Todos tienen mesa 👌': 'Everyone has a table 👌',
  'Mesa…': 'Table…', 'Zona': 'Area', 'Ancho': 'Width', 'Alto': 'Height', 'Sillas': 'Chairs', 'Forma': 'Shape', 'Redonda': 'Round', 'Larga': 'Long',
  'Eliminar mesa': 'Delete table', 'Nadie todavía': 'Nobody yet', 'Sentar aquí': 'Seat here', 'Escoge un invitado…': 'Choose a guest…',
  'Agrega mesas con los botones de arriba': 'Add tables with the buttons above', 'Llegaron': 'Arrived', '✓ Llegó': '✓ Arrived', 'Sin mesa ': 'No table',
  '¡Bienvenidos!': 'Welcome!', 'No hay invitados que coincidan.': 'No matching guests.',
  'Aquí verás las respuestas (comida, canciones, mensajes…) cuando cargues confirmaciones.': 'Responses (food, songs, messages…) will show up here once you load RSVPs.',
  '🍽️ Comida y alergias': '🍽️ Food and allergies', '🎵 Canciones pedidas': '🎵 Song requests', '👫 Acompañantes': '👫 Plus-ones', '❓ Tu pregunta': '❓ Your question', '💬 Mensajes': '💬 Messages',
  'No encontramos esa invitación': 'We couldn\'t find that invitation', 'Crea una primero y luego agrega tus invitados.': 'Create one first, then add your guests.',
  'No encontramos confirmaciones.': 'No RSVPs found.', 'Asegúrate de pegar los mensajes completos, con la línea que empieza con CL|.': 'Make sure to paste the full messages, including the line that starts with CL|.',
  'Agregar ': 'Add', 'agregado ✓': 'added ✓', 'Link general ': 'General link',
  'Te quedan {left} lugares de {max}.': '{left} of {max} spots left.', 'Llegaste al límite de {max} personas.': 'You reached the {max}-person limit.',
  ' Necesitas al menos {min} invitado para enviar.': ' You need at least {min} guest to send.',
  'No caben: el límite es de {max} personas en total.': 'Doesn\'t fit: the limit is {max} people in total.',
  '{ok} agregados. {full} no cupieron por el límite de {max}.': '{ok} added. {full} didn\'t fit because of the {max}-person limit.',
  '{n} invitados agregados': '{n} guests added', '{n} pase(s)': '{n} pass(es)', 'confirmados ({n})': 'confirmed ({n})',
  '{n} pendientes. Toca "Recordar" en cada uno.': '{n} pending. Tap "Remind" on each one.', 'No hay pendientes a quienes ya les enviaste.': 'No pending guests you\'ve already sent to.',
  '¿Eliminar a {name}?': 'Delete {name}?', 'Ajustado a {v}: el límite es de {max} personas.': 'Adjusted to {v}: the limit is {max} people.',
  '{n} confirmación(es) actualizada(s).': '{n} RSVP(s) updated.', '{n} persona(s) confirmaron con el link general y no están en tu lista:': '{n} person(s) confirmed via the general link and aren\'t on your list:',
  'No cabe: el límite es de {max} personas.': 'Doesn\'t fit: the limit is {max} people.',
  'Listo: {n} invitado(s) sentados{extra}.': 'Done: {n} guest(s) seated{extra}.', ', {n} mesa(s) nueva(s)': ', {n} new table(s)',
  '{tables} mesas · {seats} sillas · {need} personas esperadas': '{tables} tables · {seats} chairs · {need} people expected', 'faltan {n} sillas': '{n} chairs short',
  '{used} de {seats} sillas ocupadas': '{used} of {seats} chairs taken', 'sobran {n} personas': '{n} people too many', 'Sin mesa ({n})': 'No table ({n})',
  '¿Eliminar {name}? Sus invitados quedan sin mesa.': 'Delete {name}? Its guests will be left without a table.', 'Copia el link:': 'Copy the link:',
  'Mesa {n}': 'Table {n}', 'Pista': 'Dance floor', 'por asignar': 'to be assigned', '{n} libres': '{n} free', 'Importada': 'Imported',
  'Quitar uno': 'Remove one', 'Llegó uno': 'One arrived',

  // Imágenes, música y Spotify
  'Foto de portada': 'Cover photo', '🔍 Buscar imagen': '🔍 Search image', '📤 Subir la mía': '📤 Upload mine', 'Pegar un link de imagen': 'Paste an image link',
  'Las fotos del buscador son libres (Creative Commons) y el crédito al autor sale solo al pie de la invitación. Si subes la tuya, la comprimimos y va dentro del link (lo hace más largo).': 'Photos from the search are free (Creative Commons) and the author credit is added automatically at the bottom of the invitation. If you upload your own, we compress it and store it inside the link (which makes it longer).',
  '🔍 Buscar imágenes': '🔍 Search images', '📤 Subir mías': '📤 Upload mine', 'Música de fondo': 'Background music', 'Suena cuando el invitado abre el sobre. Es opcional.': 'Plays when the guest opens the envelope. Optional.',
  '🔍 Buscar música libre': '🔍 Search free music', 'Usar un link de YouTube o .mp3': 'Use a YouTube or .mp3 link',
  'La música del buscador es libre y legal (Creative Commons). Spotify no permite música de fondo escondida: para eso usa la sección': 'Music from the search is free and legal (Creative Commons). Spotify doesn\'t allow hidden background music: for that, use the',
  'Playlist de Spotify': 'Spotify playlist', 'Pega el link de una playlist, álbum o canción de Spotify (Compartir › Copiar enlace). Aparece el reproductor de Spotify dentro de la invitación.': 'Paste a link to a Spotify playlist, album or song (Share › Copy link). The Spotify player appears inside the invitation.',
  'Link de Spotify': 'Spotify link', 'Nuestra playlist': 'Our playlist', 'Foto subida': 'Uploaded photo', 'Imagen por link': 'Image from link', 'Sin foto de portada': 'No cover photo',
  'Escuchar': 'Listen', 'Canción por link': 'Song from link', 'Sin música de fondo': 'No background music', 'No se pudo reproducir': 'Couldn\'t play it',
  'Buscando una imagen para tu evento…': 'Finding an image for your event…', 'Listo. Cámbiala cuando quieras con "Buscar imagen".': 'Done. Change it anytime with "Search image".',
  'No pude buscar imágenes ahora. Súbelas o búscalas tú mismo.': 'Couldn\'t search images right now. Upload them or search yourself.',
  'Buscar música libre': 'Search free music', 'Buscar imágenes': 'Search images', 'Buscar imágenes para la galería': 'Search gallery images', 'Buscar imagen de portada': 'Search cover image',
  'Ej. piano, guitarra, romántica…': 'e.g. piano, guitar, romantic…', 'Ej. flores, playa, fiesta…': 'e.g. flowers, beach, party…', 'Buscando…': 'Searching…',
  'No encontramos nada. Prueba otra palabra (en inglés suele haber más).': 'Nothing found. Try another word.',
  'Muchas búsquedas seguidas. Espera un minuto y vuelve a intentar.': 'Too many searches in a row. Wait a minute and try again.',
  'No se pudo conectar con el buscador. Revisa tu internet.': 'Couldn\'t reach the search service. Check your connection.',
  'Puesta': 'Selected', 'Usar': 'Use', 'Música de fondo lista 🎵': 'Background music set 🎵', 'Foto de portada lista': 'Cover photo set', 'Máximo 12 fotos en la galería': 'Up to 12 photos in the gallery',
  '✓ Link de Spotify válido. Ya aparece en la invitación.': '✓ Valid Spotify link. It now shows in the invitation.', 'Ese link no parece de Spotify. Cópialo desde Compartir › Copiar enlace.': 'That doesn\'t look like a Spotify link. Copy it from Share › Copy link.',
  'Más resultados': 'More results', 'Fuente:': 'Source:', '· contenido Creative Commons': '· Creative Commons content', 'Playlist': 'Playlist',

  // Invitación (lo que ve el invitado)
  'Querido(a)': 'Dear', 'Faltan': 'Countdown', 'Días': 'Days', 'Horas': 'Hours', 'Min': 'Min', 'Seg': 'Sec', '¡Llegó el día!': 'The day is here!',
  'Dónde': 'Where', 'Lugar': 'Venue', 'Ver mapa': 'See map', 'Código de vestimenta': 'Dress code', 'Ver mesa de regalos': 'See gift registry', '¡Copiado!': 'Copied!', 'No se pudo copiar': 'Couldn\'t copy',
  'Agregar a Google Calendar': 'Add to Google Calendar', 'Descargar evento (.ics)': 'Download event (.ics)', 'Confirma tu asistencia': 'RSVP',
  'Por favor confirma antes del': 'Please RSVP by', 'Tu nombre': 'Your name', '¡Sí, ahí estaré!': 'Yes, I\'ll be there!', 'No podré ir': 'Can\'t make it', '¿Asistirás?': 'Will you attend?',
  'Tu teléfono': 'Your phone', '¿Cuántos van? (tienes {n})': 'How many are coming? (you have {n})', '¿Cuántas personas van?': 'How many people are coming?',
  'Nombres de tus acompañantes': 'Names of your plus-ones', 'Separados por coma': 'Separated by commas', 'Vegetariano, sin gluten…': 'Vegetarian, gluten-free…',
  '(opcional)': '(optional)', 'Confirmar por WhatsApp': 'RSVP on WhatsApp', 'Confirmar': 'RSVP', 'Unas palabras para los anfitriones': 'A few words for the hosts',
  '¡Gracias por confirmar! 🎉': 'Thanks for confirming! 🎉', 'Gracias por avisar 💛': 'Thanks for letting us know 💛', 'Si WhatsApp no se abrió,': 'If WhatsApp didn\'t open,', 'toca aquí': 'tap here',
  'Vista previa: aquí se abriría WhatsApp': 'Preview: WhatsApp would open here', 'Abrir invitación': 'Open invitation', 'Para:': 'To:', 'Tu mesa:': 'Your table:',
  'Te sentamos en la': 'You\'re seated at', 'Hemos reservado': 'We\'ve reserved', 'lugar para ti': 'seat for you', 'lugares para ti': 'seats for you',
  'Hecho con': 'Made with', 'gratis': 'free', 'Mi evento': 'My event', 'Este link no tiene una invitación.': 'This link doesn\'t contain an invitation.', 'Crear una gratis': 'Create one for free',
  'Ups': 'Oops', 'El link está incompleto o dañado. Pídele a quien te invitó que te lo reenvíe.': 'The link is incomplete or broken. Ask whoever invited you to send it again.',
  '¡Hola! Soy *{name}* ✅ Confirmo mi asistencia a {ev}.': 'Hi! I\'m *{name}* ✅ I\'m confirming my attendance at {ev}.',
  '¡Hola! Soy *{name}*. Lamentablemente no podré asistir a {ev} 😔': 'Hi! I\'m *{name}*. Unfortunately I can\'t make it to {ev} 😔',
  '👥 Personas: *{n}*': '👥 People: *{n}*', '👫 Acompañantes: {v}': '👫 Plus-ones: {v}', '📞 Teléfono: {v}': '📞 Phone: {v}', '🍽️ Comida: {v}': '🍽️ Food: {v}', '🎵 Canción: {v}': '🎵 Song: {v}',
  'tu evento': 'your event', 'Música': 'Music',
  // Contenido por defecto de una invitación nueva
  'Salón de eventos': 'Event hall', 'Recepción': 'Reception', 'Cena': 'Dinner', '¡A bailar!': 'Let\'s dance!', 'Ceremonia': 'Ceremony', 'Formal': 'Formal',
  'Tu presencia es nuestro mejor regalo, pero si deseas tener un detalle con nosotros:': 'Your presence is the best gift, but if you\'d like to give us something:',
};
