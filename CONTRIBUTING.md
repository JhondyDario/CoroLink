# Contributing to CoroLink

Thanks for wanting to help! CoroLink aims to stay **free, simple and private**, so contributions should keep it a static site with no backend and no build step.

## Ways to help

- **Report a problem:** [open a bug report](https://github.com/JhondyDario/CoroLink/issues/new?template=bug_report.yml)
- **Suggest an idea:** [open a feature request](https://github.com/JhondyDario/CoroLink/issues/new?template=feature_request.yml)
- **Design a template:** new event types and styles are always welcome
- **Translate:** strings live in `js/i18n.js`; template samples in `js/templates.en.js`
- **Code:** fixes and features

## Getting started

```bash
git clone https://github.com/JhondyDario/CoroLink.git
cd CoroLink
python3 -m http.server 8080
```

Open http://localhost:8080. There's nothing to install.

## Guidelines

- Plain HTML, CSS and JavaScript modules. No frameworks, no bundler.
- Spanish is the default language. Any new text should go through `t()` (or be plain text in HTML, which is translated automatically) and get an English entry in `js/i18n.js`.
- Check both **light and dark mode**, and **phone and desktop**.
- Anything read from a link or an imported file is untrusted: escape text with `esc()` and sanitize URLs and themes.
- Keep invitation links short: prefer URLs over embedded data.

See [docs/TECHNICAL.md](docs/TECHNICAL.md) for how everything fits together.
