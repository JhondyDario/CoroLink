# How CoroLink works

This page is for developers and curious users. For an overview, see the [README](../README.md).

## Architecture in one sentence

CoroLink is a **static site** (plain HTML, CSS and JavaScript modules, no build step, no backend) where **each invitation is stored inside its own link**.

## The invitation lives in the link

1. The invitation is a JSON object (texts, theme, venues, schedule, RSVP form…).
2. It's compressed with the browser's native `CompressionStream('deflate-raw')` and encoded as base64url.
3. It goes in the URL **fragment**: `i.html#d=<data>&to=<guest name>&p=<passes>&g=<guest id>&m=<table>`.

The fragment (`#…`) is never sent to any server, so hosting is static and free, and guest data stays private. A typical link is around 1 KB. Uploaded photos are compressed and embedded (they make links longer); photos from the image search are referenced by URL instead.

Everything coming from a link is treated as untrusted: text is escaped, colors, fonts and layout go through `sanitizeTheme`, and only `https://` URLs and `data:image/…` images are accepted.

## RSVPs without a server

When a guest confirms, the invitation opens WhatsApp with a pre-filled message to the host. The message ends with a short code:

```
CL|<guest id>|si|3
```

In the guest manager the host pastes those messages (or uploads an exported WhatsApp chat) and the code tells CoroLink who answered, whether they're coming and how many. Guests who used the general link are matched by name. Messages are recognized in Spanish and English.

## Local data

Drafts, guest lists, tables, favorites and personal templates are stored in `localStorage` (`corolink.*` keys). Use **Send → Export invitation** to move an invitation to another device.

## Free photos and music

The image and music search uses [Openverse](https://openverse.org), WordPress's open-content search engine. It needs no API key and returns Creative Commons content. CoroLink stores the author and license of each item and shows the credit at the bottom of the invitation, as the licenses require. Spotify is supported through its official embed player. Spotify doesn't allow hidden background playback, so background music comes from the free music search, YouTube or an `.mp3` link.

## Languages

Spanish is the main language: Spanish text is used as the translation key, so a missing translation simply shows the Spanish text. `js/i18n.js` translates the page automatically; strings with variables use `t('Text {n}', { n })`. Each invitation has its own `lang`, so a host using the app in Spanish can send an invitation in English. English sample content for templates is in `js/templates.en.js`.

## Project structure

```
index.html          Home page: templates, "My invitations"
crear.html          Editor
invitados.html      Guest manager: list, RSVPs, floor plan, check-in
i.html              The invitation guests open
css/app.css         App styles (light and dark mode)
css/gestor.css      Guest manager styles
css/invite.css      Invitation styles
js/codec.js         Compress / decompress the invitation into the link
js/templates.js     Templates, fonts, SVG decorations, theme sanitizing, limits
js/templates.en.js  English sample content for templates
js/render.js        Builds the invitation HTML
js/viewer.js        Invitation behavior: envelope, countdown, RSVP, music
js/editor.js        Editor
js/gestor.js        Guest manager
js/media.js         Openverse image/music search and Spotify embeds
js/i18n.js          Translations, date and time formats
js/chrome.js        Shared top bar: language, dark mode, GitHub, feedback
js/store.js         Local storage, favorites, duplicate, templates
js/ui.js            Shared UI pieces
js/vendor/          qrcode-generator and html-to-image (MIT)
```

## Run it locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. A server is needed because ES modules don't load from `file://`.

## Deploy

Every push to `main` is published to GitHub Pages by `.github/workflows/pages.yml`.

## Limits

`MAX_PEOPLE` (100) and `MIN_GUESTS` (1) are in `js/templates.js`.

## Add a template

Add an entry to `TEMPLATES` in `js/templates.js`, and its English text to `js/templates.en.js`:

```js
T('my-template', 'Name', 'boda',
  { layout: 'elegante', deco: 'floral', bg: '#ffffff', card: '#ffffff', text: '#333333',
    primary: '#e8b4b8', accent: '#9aab89', fontTitle: 'Great Vibes', fontBody: 'Lora', pattern: 'paper' },
  { pre: 'Nos casamos', names: 'Ana & Luis', msg: 'Sample text' },
  { itin: [['18:00', 'Ceremonia'], ['19:00', 'Cena']], dress: 'Formal' }),
```

To add a decoration, add a `corner(colors)` function to `DECOS` that returns the SVG for a 170×170 corner.
