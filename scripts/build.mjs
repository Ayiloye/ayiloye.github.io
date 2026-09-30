import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = 'https://ayiloye.github.io';
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const site = JSON.parse(read('content/site.json'));
const experiments = JSON.parse(read('content/experiments.json'));
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeUrl = (value) => {
  if (typeof value !== 'string') throw new Error('URL must be a string');
  const url = new URL(value, base);
  if (url.protocol !== 'https:' || (value.startsWith('/') && url.origin !== base)) throw new Error(`Unsupported URL: ${value}`);
  return escape(value);
};
const link = (label, href, className = '') => `<a${className ? ` class="${className}"` : ''} href="${safeUrl(href)}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)}</a>`;
const write = (file, content) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.trimStart() + '\n');
};
const dateLabel = (date) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

function parseNote(file) {
  const source = read(file);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing front matter: ${file}`);
  const meta = Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`Invalid front matter: ${file}`);
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
  for (const key of ['title', 'date', 'category', 'summary', 'slug']) if (!meta[key]) throw new Error(`Missing ${key}: ${file}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !/^[a-z0-9-]+$/.test(meta.slug)) throw new Error(`Invalid note date or slug: ${file}`);
  return { ...meta, body: match[2] };
}

function markdown(source) {
  const inline = (text) => {
    let html = escape(text);
    html = html.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, label, href) => link(label, href));
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    return html;
  };
  const lines = source.replace(/\r/g, '').split('\n');
  const out = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;
  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    if (list.length) out.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    paragraph = [];
    list = [];
  };
  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) { out.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`); code = []; inCode = false; }
      else { flush(); inCode = true; }
    } else if (inCode) code.push(line);
    else if (!line.trim()) flush();
    else if (/^#{2,3} /.test(line)) { flush(); const level = line.startsWith('### ') ? 3 : 2; out.push(`<h${level}>${inline(line.slice(level + 1))}</h${level}>`); }
    else if (line.startsWith('- ')) { if (paragraph.length) flush(); list.push(line.slice(2)); }
    else { if (list.length) flush(); paragraph.push(line.trim()); }
  }
  flush();
  if (inCode) throw new Error('Unclosed code fence');
  return out.join('\n');
}

const noteFiles = fs.readdirSync(path.join(root, 'content/notes')).filter((name) => name.endsWith('.md'));
const notes = noteFiles.map((name) => parseNote(`content/notes/${name}`)).sort((a, b) => b.date.localeCompare(a.date));
if (new Set(notes.map((note) => note.slug)).size !== notes.length) throw new Error('Duplicate note slugs');
if (!Array.isArray(experiments) || !Array.isArray(site.focus) || !Array.isArray(site.profiles)) throw new Error('Invalid content configuration');

const nav = (active) => {
  const items = [['Work', '/#work'], ['Experiments', '/experiments/'], ['Notes', '/notes/'], ['Now', '/now/']];
  const links = items.map(([name, url]) => `<a href="${url}"${active === name ? ' aria-current="page"' : ''}>${name}</a>`).join('');
  return `<header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="Kayode Ayiloye, home"><span class="brand-mark">K<span>.</span>A</span><span class="brand-name">Kayode Ayiloye</span></a><nav class="desktop-nav" aria-label="Primary">${links}${link('GitHub ↗', 'https://github.com/Ayiloye', 'nav-external')}</nav><details class="mobile-nav"><summary>Menu <span aria-hidden="true">+</span></summary><nav aria-label="Mobile primary">${links}${link('GitHub ↗', 'https://github.com/Ayiloye')}</nav></details></div></header>`;
};
function layout({ title, description, pathname, active = '', body, schema = null }) {
  const canonical = `${base}${pathname}`;
  const fullTitle = pathname === '/' ? 'Kayode Ayiloye | AI Builder & Product Founder' : `${title} | Kayode Ayiloye`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f5f1">
  <title>${escape(fullTitle)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${pathname.startsWith('/notes/') && pathname !== '/notes/' ? 'article' : 'website'}">
  <meta property="og:title" content="${escape(fullTitle)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Kayode Ayiloye">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escape(fullTitle)}">
  <meta name="twitter:description" content="${escape(description)}">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/assets/style.css">
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav(active)}
  <main id="main">${body}</main>
  <footer class="site-footer"><div class="wrap footer-grid"><div><a class="footer-name" href="/">Kayode Ayiloye<span>.</span></a><p>Building useful software. Sharing what the work teaches.</p></div><div><span class="eyebrow">Explore</span><a href="/#work">Work</a><a href="/experiments/">Experiments</a><a href="/notes/">Notes</a><a href="/now/">Now</a></div><div><span class="eyebrow">Connect</span>${site.profiles.map((profile) => link(`${profile.label} ↗`, profile.url)).join('')}</div></div><div class="wrap footer-bottom"><span>© ${site.updated.slice(0, 4)} Kayode Ayiloye</span><span>Built for the open web · Hosted on GitHub Pages</span></div></footer>
</body>
</html>`;
}

const personSchema = { '@context': 'https://schema.org', '@type': 'Person', name: 'Kayode Ayiloye', url: base, jobTitle: 'AI Builder & Product Founder', description: 'Builds practical software and AI systems.', sameAs: ['https://github.com/Ayiloye'], affiliation: { '@type': 'Organization', name: 'Kayus Systems' } };
const focusCards = site.focus.map((item, index) => `<li class="focus-item"><span class="item-number">0${index + 1}</span><div><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p></div></li>`).join('');
const latest = notes[0];
const home = `<section class="hero wrap"><div class="hero-main"><p class="eyebrow"><span class="eyebrow-rule"></span> Independent builder · Founder, Kayus Systems</p><h1>Kayode<br><em>Ayiloye.</em></h1><div class="hero-bottom"><p class="hero-role">AI Builder &amp; Product Founder</p><p class="hero-lede">I identify real-world problems and use AI, automation, and software to build practical solutions.</p><p class="hero-support">I experiment with emerging technologies, build real products, and share what works, what fails, and what I learn along the way.</p><div class="hero-actions"><a class="button button-dark" href="#work">Explore my work <span aria-hidden="true">↗</span></a><a class="text-link" href="/notes/">Read my notes <span aria-hidden="true">→</span></a></div></div></div><div class="hero-aside" aria-hidden="true"><div class="orbit"><div class="orbit-inner"></div><span class="orbit-dot"></span></div><span class="aside-label">Questions into useful systems.</span><span class="aside-index">01 / 04</span></div></section>
<section class="intro-section section-pad" id="about"><div class="wrap intro-grid"><p class="section-kicker">01 / About</p><div><h2>Curiosity is useful<br>when it leads to <em>work.</em></h2><p class="section-lede">I’m a product-minded builder interested in where emerging technology meets ordinary, stubborn problems.</p><p>I research the problem, test the technology, and build focused software around what proves useful. My work spans practical AI, agent systems, automation, and AI-assisted engineering. I share selected lessons from the process, including the parts that do not work.</p><p class="company-note">I’m the founder of <strong>Kayus Systems</strong>. This is my personal space for public work and thinking.</p></div></div></section>
<section class="work-section section-pad" id="work"><div class="wrap"><div class="section-heading"><p class="section-kicker">02 / The work</p><h2>What I work on<span class="period">.</span></h2><p>Broad areas of practice. Specific projects appear here when they are ready to be public.</p></div><div class="work-list"><article><span>01</span><div><h3>AI &amp; agent systems</h3><p>Exploring how models, tools, and workflows can perform useful work reliably.</p></div><span aria-hidden="true">↗</span></article><article><span>02</span><div><h3>Practical software products</h3><p>Turning painful real-world problems into focused tools people can actually use.</p></div><span aria-hidden="true">↗</span></article><article><span>03</span><div><h3>Automation</h3><p>Removing repetitive work while preserving human control over meaningful decisions.</p></div><span aria-hidden="true">↗</span></article><article><span>04</span><div><h3>Product experiments</h3><p>Testing emerging technologies to understand what is useful beyond the hype.</p></div><span aria-hidden="true">↗</span></article><article><span>05</span><div><h3>AI-assisted engineering</h3><p>Improving research, development, testing, review, and execution with better workflows.</p></div><span aria-hidden="true">↗</span></article></div></div></section>
<section class="focus-section section-pad" id="focus"><div class="wrap focus-grid"><div><p class="section-kicker">03 / Current focus</p><h2>Building for what<br><em>comes next.</em></h2><p>My current areas of exploration. The details change as the work teaches me more.</p><a class="light-link" href="/now/">Visit the now page <span aria-hidden="true">↗</span></a></div><ol class="focus-list">${focusCards}</ol></div></section>
<section class="public-section section-pad"><div class="wrap"><div class="section-heading"><p class="section-kicker">04 / In public</p><h2>Evidence, as it exists<span class="period">.</span></h2><p>Selected public work and notes. I would rather show a small honest record than fill this space with claims.</p></div><div class="public-grid"><article class="feature-panel"><div class="panel-top"><span class="eyebrow">Open source / Site code</span><span aria-hidden="true">↗</span></div><h3>This website</h3><p>The source and content behind this personal site are public on GitHub.</p>${link('View repository', 'https://github.com/Ayiloye/ayiloye.github.io', 'panel-link')}</article><article class="feature-panel"><div class="panel-top"><span class="eyebrow">Writing / ${escape(latest.category)}</span><span>${dateLabel(latest.date)}</span></div><h3>${escape(latest.title)}</h3><p>${escape(latest.summary)}</p><a class="panel-link" href="/notes/${escape(latest.slug)}/">Read the note <span aria-hidden="true">↗</span></a></article><article class="feature-panel experiments-panel"><div class="panel-top"><span class="eyebrow">Experiments / Developing</span><span aria-hidden="true">↗</span></div><h3>Experiments with receipts.</h3><p>Public experiments will be added with what was tested, what happened, and what I learned.</p><a class="panel-link" href="/experiments/">Explore experiments <span aria-hidden="true">↗</span></a></article></div></div></section>
<section class="principles-section section-pad"><div class="wrap principles-grid"><div><p class="section-kicker">05 / Principles</p><h2>How I approach<br>the work<span class="period">.</span></h2></div><ol><li>Solve real problems.</li><li>Build before claiming expertise.</li><li>Use AI as leverage, with human judgment.</li><li>Automate repetition. Keep people in control of important decisions.</li><li>Share lessons that help someone else build better.</li></ol></div></section>
<section class="closing-section"><div class="wrap closing-grid"><div><p class="section-kicker">06 / Connect</p><h2>Have a useful problem<br>worth discussing?</h2></div><div><p>Find my public work on GitHub. Other ways to connect will appear here when they are verified and ready to share.</p>${link('View GitHub profile ↗', 'https://github.com/Ayiloye', 'button button-light')}</div></div></section>`;
write('index.html', layout({ title: 'Home', description: 'Kayode Ayiloye builds practical software and AI systems, experiments with emerging technology, and shares lessons from turning real-world problems into useful products.', pathname: '/', body: home, schema: personSchema }));

const pageHero = (number, label, title, intro) => `<section class="page-hero wrap"><p class="section-kicker">${number} / ${label}</p><h1>${title}</h1><p>${intro}</p></section>`;
const nowBody = `${pageHero('Now', 'Current focus', 'What I’m working on<span class="period">.</span>', 'A dated snapshot of the themes guiding my work. This page changes as my focus changes.')}<section class="page-content wrap"><p class="update-stamp">Last updated <time datetime="${site.updated}">${dateLabel(site.updated)}</time></p><ol class="now-list">${focusCards}</ol><div class="page-note"><h2>What this page is for</h2><p>I’m building practical software, exploring agentic workflows, studying emerging technology, and improving AI-assisted engineering. I’ll update this page when those priorities shift, and publish selected lessons as the work becomes public.</p><a class="text-link" href="/notes/">Read the notes <span aria-hidden="true">→</span></a></div></section>`;
write('now/index.html', layout({ title: 'Now', description: 'What Kayode Ayiloye is focused on now: practical software, AI agents, automation, and AI-assisted engineering.', pathname: '/now/', active: 'Now', body: nowBody }));

const noteList = notes.map((note) => `<li><a href="/notes/${escape(note.slug)}/"><span class="eyebrow">${escape(note.category)} · <time datetime="${note.date}">${dateLabel(note.date)}</time></span><h2>${escape(note.title)} <span aria-hidden="true">↗</span></h2><p>${escape(note.summary)}</p></a></li>`).join('');
const notesBody = `${pageHero('Notes', 'Writing', 'Notes from the work<span class="period">.</span>', 'Short accounts of what I build, test, and learn. Published when there is something useful to say.')}<section class="page-content wrap"><ul class="note-list">${noteList}</ul></section>`;
write('notes/index.html', layout({ title: 'Notes', description: 'Writing and notes from Kayode Ayiloye on building useful software, AI systems, and product experiments.', pathname: '/notes/', active: 'Notes', body: notesBody }));
for (const note of notes) {
  const article = `<article class="article wrap"><a class="back-link" href="/notes/">← All notes</a><header><p class="eyebrow">${escape(note.category)} · <time datetime="${note.date}">${dateLabel(note.date)}</time></p><h1>${escape(note.title)}</h1><p class="article-summary">${escape(note.summary)}</p></header><div class="prose">${markdown(note.body)}</div><footer><a class="text-link" href="/notes/">More notes <span aria-hidden="true">→</span></a></footer></article>`;
  write(`notes/${note.slug}/index.html`, layout({ title: note.title, description: note.summary, pathname: `/notes/${note.slug}/`, active: 'Notes', body: article }));
}

const experimentCards = experiments.length ? experiments.map((item) => {
  for (const key of ['title', 'date', 'description', 'status', 'technologies', 'lessons']) if (!item[key]) throw new Error(`Missing experiment ${key}`);
  return `<article class="experiment-card"><p class="eyebrow">${escape(item.status)} · ${escape(item.date)}</p><h2>${escape(item.title)}</h2><p>${escape(item.description)}</p><p><strong>Tools:</strong> ${escape(item.technologies.join(', '))}</p><p><strong>Learned:</strong> ${escape(item.lessons)}</p><div>${['githubUrl', 'articleUrl', 'demoUrl'].filter((key) => item[key]).map((key) => link(key.replace('Url', ''), item[key])).join('')}</div></article>`;
}).join('') : `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">↗</span><h2>Work first. Write-up second.</h2><p>No public experiments are listed yet. When one is ready, this page will include the question, method, result, and lesson, with a link to code or a demo when available.</p><a class="text-link" href="/notes/">Read the notes <span aria-hidden="true">→</span></a></div>`;
const experimentsBody = `${pageHero('Experiments', 'Public experiments', 'The test bench<span class="period">.</span>', 'A place for public technical experiments and what they teach me.')}<section class="page-content wrap">${experimentCards}</section>`;
write('experiments/index.html', layout({ title: 'Experiments', description: 'Public experiments and lessons from Kayode Ayiloye on AI, automation, and practical software.', pathname: '/experiments/', active: 'Experiments', body: experimentsBody }));

const routes = ['/', '/now/', '/notes/', '/experiments/', ...notes.map((note) => `/notes/${note.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>${base}${route}</loc></url>`).join('')}</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`);
write('404.html', layout({ title: 'Page not found', description: 'This page could not be found.', pathname: '/404.html', body: `<section class="page-hero wrap"><p class="section-kicker">404 / Not found</p><h1>Nothing here<span class="period">.</span></h1><p>This page may have moved. Start again from the homepage.</p><a class="button button-dark" href="/">Go home →</a></section>` }));
console.log(`Built ${routes.length} pages and supporting files.`);
