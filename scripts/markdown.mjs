import { escape, safeUrl } from './html.mjs';

export function markdown(source) {
  const plain = (text) => escape(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const inline = (text) => {
    const pattern = /\[([^\]]+)\]\((https:\/\/[^\s)]+|\/[^\s)]*)\)/g;
    const links = [];
    // Keep links opaque while formatting the full line, so **text [link](url)**
    // can span a link without escaping the anchor or losing the emphasis.
    const withTokens = text.replace(pattern, (_, label, href) => {
      const target = safeUrl(href);
      const external = href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : '';
      const index = links.push(`<a href="${target}"${external}>${inline(label)}</a>`) - 1;
      return `\uE000${index}\uE001`;
    });
    return plain(withTokens).replace(/\uE000(\d+)\uE001/g, (_, index) => links[Number(index)]);
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
