# 💌 Convida

Invitaciones digitales **gratis**, sin registro y sin servidor. Para bodas, XV años, cumpleaños, baby showers, bautizos, graduaciones y eventos corporativos. Funciona en celular y en PC.

## Qué trae

- **13 plantillas** listas, más tus propias plantillas (guardar, exportar e importar en `.json`).
- **Editor con vista previa en vivo**: estilos (Clásico, Moderno, Elegante), 9 decoraciones en SVG, paletas, 13 tipografías y fondos.
- **Sobre animado** con el nombre del invitado y música (YouTube o `.mp3`).
- **Cuenta regresiva**, **lugares con mapa** (Google Maps y Waze), **itinerario**, **vestimenta**, **regalos** (con botón para copiar la cuenta) y **galería**.
- **Confirmación (RSVP) por WhatsApp**: el invitado confirma y te llega el mensaje directo.
- **Links por invitado** con nombre y pases, carga por lista, control de enviados y exportación a CSV.
- **Agregar al calendario** (Google Calendar y `.ics`), **código QR** e **imagen PNG** de la portada.

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
