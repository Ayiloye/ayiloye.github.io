export const base = 'https://ayiloye.github.io';

export const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export const safeUrl = (value) => {
  if (typeof value !== 'string') throw new Error('URL must be a string');
  const url = new URL(value, base);
  if (url.protocol !== 'https:' || (value.startsWith('/') && url.origin !== base)) throw new Error(`Unsupported URL: ${value}`);
  return escape(value);
};

export const link = (label, href, className = '') => `<a${className ? ` class="${className}"` : ''} href="${safeUrl(href)}"${href.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(label)}</a>`;
