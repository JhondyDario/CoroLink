# 💌 Convida

Invitaciones digitales **gratis**, sin registro y sin servidor, con gestor de invitados y sala virtual. Funciona en celular y en PC.

## Qué trae

- **33 plantillas para 28 tipos de evento**, en 5 categorías:
  - **Amor**: boda, aniversario, despedida.
  - **Familia**: XV, cumpleaños, baby shower, bautizo, graduación, bienvenida, reencuentro, cena familiar.
  - **Gamer y tech**: torneo / eSports, LAN party, lanzamiento de juego, watch party, rol / juegos de mesa.
  - **Fiestas**: fiesta, Halloween, Año Nuevo, junte / BBQ, pool party, open house.
  - **Profesional**: corporativo, lanzamiento de producto, taller, conferencia, meetup, evento benéfico.
- **Tus propias plantillas**: guardar, exportar e importar en `.json`.
- **Editor con vista previa en vivo**: 4 estilos (Clásico, Moderno, Elegante, Neón), 15 decoraciones en SVG, paletas, 19 tipografías y fondos.
- **Sobre animado** con el nombre del invitado y música (YouTube o `.mp3` por link).
- **Cuenta regresiva**, **mapa** (Google Maps y Waze), **itinerario**, **vestimenta**, **regalos** y **galería**.
- **Formulario de confirmación a tu medida**: el nombre siempre; además puedes pedir (no / opcional / obligatorio) teléfono, número de personas, nombres de acompañantes, alergias, canción favorita, mensaje y una pregunta propia.
- **Agregar al calendario** (Google Calendar y `.ics`), **código QR** e **imagen PNG** de la portada.

### Gestor de invitados (`invitados.html`)

- **Lista**: agregar uno a uno o pegando una lista, grupos, búsqueda y filtros, envío por WhatsApp con mensaje editable, recordatorios a pendientes y CSV con todas las respuestas.
- **Confirmaciones**: cada respuesta de WhatsApp trae un código (`CV|id|si|3`). Pegas los mensajes (o subes el chat exportado) y se marcan solos. Quien confirmó con el link general se reconoce por su nombre.
- **Sala virtual**: plano del salón con mesas redondas y largas, zonas (pista, tarima), arrastrar con el dedo o el mouse, y **sentar automáticamente** manteniendo juntos a los del mismo grupo. Cada invitado ve su mesa en la invitación.
- **Check-in**: el día del evento marcas quién llega; el plano se va llenando en vivo y la pantalla de bienvenida dice a qué mesa va cada quien (modo pantalla completa para una tablet en la entrada).
- **Límites**: máximo 100 personas por evento (suma de pases) y mínimo 1 invitado para enviar. Se cambian en `MAX_PEOPLE` y `MIN_GUESTS` dentro de `js/templates.js`.

## Cómo funciona por dentro

No hay base de datos. La invitación completa se convierte a JSON, se comprime con `deflate-raw` (API `CompressionStream` del navegador) y se guarda en el *fragmento* del link:

```
https://tu-usuario.github.io/convida/i.html#d=<invitación comprimida>&to=Familia%20Pérez&p=4
```

El fragmento (`#...`) nunca se envía a ningún servidor, así que el hosting es estático y gratis, y los datos de tus invitados son privados. Un link normal pesa menos de 1 KB. Las fotos subidas se comprimen y van dentro del link (lo hacen más largo); por eso también se pueden usar links de imágenes.

Los borradores, invitados y plantillas propias se guardan en el `localStorage` del navegador. Para pasarlos a otro dispositivo usa **Enviar → Exportar invitación**.

## Estructura

```
index.html        Portada, plantillas y "Mis invitaciones"
crear.html        Editor
i.html            Visor de la invitación (lo que abre el invitado)
css/app.css       Estilos del sitio y del editor
css/invite.css    Estilos de la invitación
js/codec.js       Comprimir y descomprimir la invitación en el link
js/templates.js   Plantillas, fuentes, decoraciones SVG y limpieza del tema
js/render.js      Arma el HTML de la invitación
js/viewer.js      Lógica del visor: sobre, cuenta regresiva, RSVP, música
js/editor.js      Lógica del editor
js/gestor.js      Gestor de invitados: lista, confirmaciones, sala y check-in
invitados.html    Página del gestor
js/store.js       Guardado local
js/vendor/        qrcode-generator y html-to-image (MIT)
```

Sin build ni dependencias: HTML, CSS y JavaScript con módulos ES.

## Correrlo en tu PC

```bash
python3 -m http.server 8080
```

Y abre http://localhost:8080. Hace falta un servidor (aunque sea ese) porque los módulos ES no cargan desde `file://`.

## Publicarlo gratis en GitHub Pages

1. Sube el repo a GitHub.
2. En **Settings → Pages**, en *Source* escoge **GitHub Actions**.
3. Cada `push` a `main` lo publica solo (ver `.github/workflows/pages.yml`).

## Crear una plantilla nueva en el código

Agrega una entrada en `TEMPLATES` dentro de `js/templates.js`:

```js
T('mi-plantilla', 'Nombre', 'boda',
  { layout: 'elegante', deco: 'floral', bg: '#ffffff', card: '#ffffff', text: '#333333',
    primary: '#e8b4b8', accent: '#9aab89', fontTitle: 'Great Vibes', fontBody: 'Lora', pattern: 'paper' },
  { pre: 'Nos casamos', names: 'Ana & Luis', msg: 'Texto de ejemplo' }),
```

Para una decoración nueva, agrega una función `corner(colores)` en `DECOS` que devuelva SVG para una esquina de 170×170.

## Seguridad

Todo lo que viene del link se trata como no confiable: el texto se escapa, los colores, fuentes y estilos pasan por `sanitizeTheme`, y sólo se aceptan URLs `https://` y imágenes `data:image/...`.

## Licencia

MIT
