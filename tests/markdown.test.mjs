import test from 'node:test';
import assert from 'node:assert/strict';
import { markdown } from '../scripts/markdown.mjs';

test('Markdown links escape labels and URL parameters once', () => {
  assert.equal(markdown('[A & B](https://example.com/?a=1&b=2)'), '<p><a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">A &amp; B</a></p>');
});

test('Markdown text escapes HTML', () => {
  assert.equal(markdown('<script>alert(1)</script>'), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});
