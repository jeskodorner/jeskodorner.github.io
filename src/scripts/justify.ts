/**
 * Randvolle Fotoreihen für Listen mit [data-justify] – neu verteilen bei Größenänderungen und nach dem Einfügen
 * neuer Fotos. Die Rechnung steht in justify-layout.js; dieselbe Datei läuft schon direkt nach der Fotoliste im
 * HTML (JustifyNow.astro), damit die Reihen beim ersten Bild fertig sind.
 */
import './justify-layout.js';

declare global {
  interface Window {
    jdLayout?: (list: HTMLElement) => void;
  }
}

const layout = (list: HTMLElement) => window.jdLayout?.(list);

/** Alle Listen sofort neu verteilen (z. B. direkt nach dem Einfügen neuer Fotos) */
export function justifyAll() {
  for (const list of document.querySelectorAll<HTMLElement>('[data-justify]')) layout(list);
}

export function initJustify() {
  const lists = document.querySelectorAll<HTMLElement>('[data-justify]');
  if (!lists.length) return;
  // Nur auf Breitenänderungen reagieren (die Höhe ändert sich durch das Layout selbst). Die erste Breite ist die,
  // mit der schon direkt im HTML verteilt wurde – dann nicht noch einmal.
  const widths = new WeakMap<Element, number>();
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const w = Math.round(e.contentRect.width);
      if (widths.get(e.target) === w) continue;
      widths.set(e.target, w);
      layout(e.target as HTMLElement);
    }
  });
  for (const list of lists) {
    if (!list.hasAttribute('data-justified')) layout(list);
    ro.observe(list);
  }
}
