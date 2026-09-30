import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pages = ['index.html', 'now/index.html', 'notes/index.html', 'experiments/index.html', 'notes/why-this-space-exists/index.html', '404.html'];
const failures = [];
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!/<html lang="en">/.test(html)) failures.push(`${file}: missing language`);
  if (!/<main id="main">/.test(html)) failures.push(`${file}: missing main landmark`);
  if (!/<h1[ >]/.test(html)) failures.push(`${file}: missing h1`);
  for (const tag of ['description', 'twitter:card']) if (!html.includes(`name="${tag}"`)) failures.push(`${file}: missing ${tag}`);
  for (const tag of ['og:title', 'og:description', 'og:url']) if (!html.includes(`property="${tag}"`)) failures.push(`${file}: missing ${tag}`);
  if (!html.includes('rel="canonical"')) failures.push(`${file}: missing canonical`);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith('/')) continue;
    const urlPath = href.split(/[?#]/)[0];
    if (!urlPath) continue;
    const target = path.join(root, urlPath.endsWith('/') ? `${urlPath}index.html` : urlPath);
    if (!fs.existsSync(target)) failures.push(`${file}: broken link ${href}`);
  }
}
for (const file of ['assets/style.css', 'assets/favicon.svg', 'sitemap.xml', 'robots.txt']) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${pages.length} pages, local links, and metadata.`);
