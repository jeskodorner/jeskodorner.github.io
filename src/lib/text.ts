/** Mini-Markdown für kurze Texte: HTML wird escaped, *Wort* wird zu <em>Wort</em>. */
export function inlineMd(text = ''): string {
  const escaped = text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
