# Kayode Ayiloye — personal site

The source for [ayiloye.github.io](https://ayiloye.github.io), the personal website of Kayode Ayiloye, AI Builder & Product Founder and founder of Kayus Systems.

The site is static and uses free GitHub Pages hosting. There is no database, third-party script, runtime API request, or paid service.

## Work locally

Use Node.js 20 or newer. There are no packages to install.

```sh
npm run build
npm run lint
npm run check
npm test
```

Run `npm run serve` to preview routes at `http://127.0.0.1:8000`.

The build reads `content/` and writes the publishable HTML files in the repository root. Commit generated files alongside content changes. The verification workflow rebuilds and checks that the committed output matches.

## Edit content

- Current focus, update date, and verified external profiles: `content/site.json`
- Public experiments: `content/experiments.json`
- Notes: `content/notes/*.md`
- Layout and page copy: `scripts/build.mjs`
- Visual design: `assets/style.css`

See [site architecture](docs/SITE_ARCHITECTURE.md) and the [content guide](docs/CONTENT_GUIDE.md) before publishing new work.
