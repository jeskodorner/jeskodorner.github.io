/**
 * „← Zurück“ oben auf Album-, Film- und Mappe-Seiten (Links mit data-back). Überall gleich beschriftet und gleich im
 * Verhalten (seit 21.11.2026; vorher hieß er im Album „Alle Galerien“ und im Film „Alle Filme“ und führte immer zur
 * Übersicht):
 * - Kam man von dieser Website, geht es genau dorthin zurück, wie mit dem Zurück-Knopf des Browsers – samt Stelle
 *   auf der Seite (Startseite, Portfolio, Übersicht, vorheriges Album …).
 * - Ohne Vorgeschichte (Link von außen, neuer Tab) führt der Link zu seinem eigenen Ziel (href): Album → Übersicht der
 *   Galerien an der Stelle des Albums, Film → Übersicht der Filme, Mappe → Startseite.
 * Mit gedrückter Befehls-/Strg-Taste (neuer Tab) bleibt es ein normaler Link.
 */
export function initBackLinks() {
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-back]')) {
    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === location.origin && ref.pathname !== location.pathname && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  }
}
