import test from 'node:test';
import assert from 'node:assert/strict';
import { markdown } from '../scripts/markdown.mjs';

test('Markdown links escape labels and URL parameters once', () => {
  assert.equal(markdown('[A & B](https://example.com/?a=1&b=2)'), '<p><a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">A &amp; B</a></p>');
});

test('Markdown text escapes HTML', () => {
  assert.equal(markdown('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('Markdown formats a link label and emphasis spanning a link', () => {
  assert.equal(markdown('[**Bold** and `code`](https://example.com/)'), '<p><a href="https://example.com/" target="_blank" rel="noopener noreferrer"><strong>Bold</strong> and <code>code</code></a></p>');
  assert.equal(markdown('**Read [the note](/notes/) now**'), '<p><strong>Read <a href="/notes/">the note</a> now</strong></p>');
});

test('Markdown escapes HTML inside a formatted link label', () => {
  assert.equal(markdown('[**<unsafe>**](https://example.com/)'), '<p><a href="https://example.com/" target="_blank" rel="noopener noreferrer"><strong>&lt;unsafe&gt;</strong></a></p>');
});
