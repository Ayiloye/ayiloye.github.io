import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('identity and organization are represented accurately', () => {
  const home = read('index.html');
  assert.match(home, /Kayode Ayiloye \| AI Builder &amp; Product Founder/);
  assert.match(home, /Founder, Kayus Systems/);
  assert.match(home, /"@type":"Person"/);
  assert.match(home, /"name":"Kayus Systems"/);
});

test('unconfigured contact channels are absent', () => {
  const pages = ['index.html', 'now/index.html', 'notes/index.html', 'experiments/index.html'];
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /mailto:|linkedin\.com|twitter\.com|x\.com|youtube\.com/i);
  }
});

test('note content is published with a valid date and canonical URL', () => {
  const article = read('notes/why-this-space-exists/index.html');
  assert.match(article, /<time datetime="2026-09-30">/);
  assert.match(article, /href="https:\/\/ayiloye\.github\.io\/notes\/why-this-space-exists\/"/);
  assert.match(read('sitemap.xml'), /notes\/why-this-space-exists\//);
});

test('Now page keeps a logical heading sequence', () => {
  const now = read('now/index.html');
  assert.match(now, /<h1>/);
  assert.match(now, /<h2>Practical AI systems<\/h2>/);
  assert.doesNotMatch(now, /<h3>/);
});
