/** Mini-Markdown für kurze Texte: HTML wird escaped, *Wort* wird zu <em>Wort</em>. */
export function inlineMd(text = ''): string {
  const escaped = text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Titel sauber umbrechen: Ein Gedankenstrich bleibt beim Wort davor und beginnt nie eine Zeile
 * („Kunst KEL –“ / „Malerei“ statt „Kunst KEL“ / „– Malerei“).
 */
export function tidyTitle(title = ''): string {
  return (
    title
      .replace(/ ([–—]) /g, '\u00A0$1 ')
      // „Anouk & Yael“, „Photoautomat x Hilda“: das Zeichen nie allein am Zeilenende oder -anfang (seit 23.11.2026)
      .replace(/ (&|x|×|\+) /g, '\u00A0$1\u00A0')
  );
}
