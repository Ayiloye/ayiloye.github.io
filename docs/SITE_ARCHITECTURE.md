# Site architecture

## Choice

The site uses semantic HTML, CSS, a small dependency-free Node.js generator, and GitHub Pages branch publishing. The old site already used branch publishing from `master` at the root. Keeping that path avoids a deployment service or additional build workflow. Node runs only while authoring; visitors receive static files with no runtime JavaScript or external requests.

This is appropriate for the current small site. If the writing library grows substantially, a mature static-site generator can replace the script without changing the published URLs.

## Layout

```text
assets/                 Stylesheet and favicon
content/site.json       Dated focus and verified external profiles
content/experiments.json  Curated public experiment entries
content/notes/          Markdown notes with front matter
scripts/build.mjs       Static page generator
scripts/check.mjs       Link and metadata checks
tests/                  Content smoke tests
docs/                   Brand, audit, architecture, and writing guide
index.html              Generated homepage
now/, notes/, experiments/  Generated pages
```

Generated HTML, `sitemap.xml`, `robots.txt`, and `404.html` are committed. The `verify` GitHub Action checks pull requests and pushes to `master`. It does not deploy. GitHub Pages serves the `master` root automatically after a merge.

## Build and publish

1. Install Node.js 20 or newer; no `npm install` is needed.
2. Edit content or layout.
3. Run `npm run build`, `npm run lint`, `npm run check`, and `npm test`.
4. Commit source and generated output on a branch; open a pull request.
5. Merge after review and confirm the live pages at `https://ayiloye.github.io/`.

Hosting cost is **₦0** on free GitHub Pages. There is no custom domain, database, analytics service, paid CMS, or backend.

## Content operations

- **Focus and Now page:** edit `content/site.json`; update `updated` when the focus changes.
- **External links:** add only verified public URLs to `profiles` in `content/site.json`; an absent link is hidden.
- **Notes:** add a Markdown file to `content/notes/` with `title`, `date`, `category`, `summary`, and URL-safe `slug` front matter. Supported body syntax: paragraphs, `##`/`###` headings, unordered lists, fenced code blocks, inline code, bold, and HTTPS or site-relative links. HTML is escaped. Keep the slug stable after publishing.
- **Experiments:** add a public entry to `content/experiments.json` with title, date, description, status, technologies, and lessons. Optional `githubUrl`, `articleUrl`, and `demoUrl` fields appear only when set. All URLs must be public and verified.
- **Selected open source:** edit the curated section in `scripts/build.mjs` after checking repository visibility and relevance.

The Markdown feature is intentionally small. Use plain text and supported syntax, or extend the generator with tests before adding complex media. Videos, case studies, and research reports can use new static templates later.
