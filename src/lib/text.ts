/** Mini-Markdown für kurze Texte: HTML wird escaped, *Wort* wird zu <em>Wort</em>. */
export function inlineMd(text = ''): string {
  const escaped = text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Zerlegt einen kurzen Text in einzelne Wörter (<span class="w" style="--i:n">),
 * damit sie beim Scrollen nacheinander aufleuchten können. *Wort* wird kursiv (<em>).
 */
export function wordSpans(text = ''): string {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  let i = 0;
  const out: string[] = [];
  // Abwechselnd normale Teile und *kursive* Teile
  text.split(/(\*[^*]+\*)/).forEach((part) => {
    if (!part) return;
    const italic = part.startsWith('*') && part.endsWith('*');
    const words = (italic ? part.slice(1, -1) : part).split(/\s+/).filter(Boolean);
    const spans = words.map((w) => `<span class="w" style="--i:${i++}">${esc(w)}</span>`).join(' ');
    out.push(italic ? `<em>${spans}</em>` : spans);
  });
  return out.join(' ');
}
