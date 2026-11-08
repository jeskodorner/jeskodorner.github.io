/**
 * Gleich hohe, randvolle Reihen „wie Lightroom“ für Listen mit [data-justify].
 * Jedes Kind trägt sein Seitenverhältnis als CSS-Variable --r, die Zielhöhe einer Reihe kommt aus CSS (--row).
 *
 * Das Skript verteilt die Fotos so auf Reihen, dass JEDE Reihe die ganze Breite füllt – auch die letzte – und
 * alle Reihen insgesamt möglichst nah an der Zielhöhe bleiben (die Verteilung wird über die ganze Liste
 * optimiert, nicht Reihe für Reihe). Nur wenn ein Album so wenige Fotos hat, dass sie randvoll höher als der
 * Bildschirm würden (z. B. ein einzelnes Hochformat), bleibt rechts Platz.
 *
 * Ohne JavaScript übernimmt reines CSS (flex-grow), dann ist nur die letzte Reihe nicht gestreckt.
 */

/** So hoch darf eine Reihe höchstens werden: das Größere aus Zielhöhe × MAX_GROW und 80 % der Fensterhöhe */
const MAX_GROW = 1.9;
const MAX_VIEWPORT = 0.8;
/** Höchstens so viel kleiner (mehr Fotos passen dann nicht in eine Reihe) */
const MIN_SHRINK = 0.55;

/** Zielhöhe aus --row in Pixeln (über ein unsichtbares Messelement, klappt in allen Browsern gleich) */
function rowTarget(list: HTMLElement): number {
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;height:0;padding:0;border:0;width:var(--row)';
  list.append(probe);
  const px = probe.getBoundingClientRect().width;
  probe.remove();
  return px;
}

function layout(list: HTMLElement) {
  const width = list.clientWidth;
  if (!width) return; // ausgeblendet
  const items = [...list.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (!items.length) return;

  const target = rowTarget(list);
  if (!target || !Number.isFinite(target)) return;
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;

  // Breite eines Fotos pro Pixel Reihenhöhe = Seitenverhältnis
  const units = items.map((el) => Number(el.style.getPropertyValue('--r')) || 1);
  const n = units.length;
  const avail = width - 1; // Rundungsreserve, damit nichts umbricht
  const maxH = Math.max(target * MAX_GROW, window.innerHeight * MAX_VIEWPORT);
  const minH = target * MIN_SHRINK;

  // best[i] = kleinste Abweichung, um die ersten i Fotos auf volle Reihen zu verteilen
  const best = new Array<number>(n + 1).fill(Infinity);
  const from = new Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let i = 1; i <= n; i++) {
    let sum = 0;
    for (let j = i - 1; j >= 0; j--) {
      sum += units[j]!;
      const k = i - j;
      const h = (avail - gap * (k - 1)) / sum;
      if (h < minH && k > 1) break; // noch mehr Fotos machen die Reihe nur flacher
      const dev = Math.log(h / target);
      // Zu hohe Reihen stark bestrafen, damit sie nur vorkommen, wenn es gar nicht anders geht
      const cost = dev * dev + (h > maxH ? 50 + dev : 0);
      if (best[j]! + cost < best[i]!) {
        best[i] = best[j]! + cost;
        from[i] = j;
      }
    }
  }

  // Reihen aus der Rückverfolgung zusammensetzen
  const rows: [number, number][] = [];
  for (let i = n; i > 0; i = from[i]!) rows.unshift([from[i]!, i]);

  for (const [j, i] of rows) {
    let sum = 0;
    for (let x = j; x < i; x++) sum += units[x]!;
    const full = (avail - gap * (i - j - 1)) / sum;
    const h = Math.min(full, maxH);
    const fill = h === full;
    for (let x = j; x < i; x++) {
      const w = Math.floor(units[x]! * h * 100) / 100;
      // Volle Reihen schließen die letzten Bruchteile eines Pixels per flex-grow (anteilig, Format bleibt)
      items[x]!.style.flex = fill ? `${units[x]} 1 ${w}px` : `0 0 ${w}px`;
    }
  }
}

/** Alle Listen sofort neu verteilen (z. B. direkt nach dem Einfügen neuer Fotos) */
export function justifyAll() {
  for (const list of document.querySelectorAll<HTMLElement>('[data-justify]')) layout(list);
}

export function initJustify() {
  const lists = document.querySelectorAll<HTMLElement>('[data-justify]');
  if (!lists.length) return;
  // Nur auf Breitenänderungen reagieren (die Höhe ändert sich durch das Layout selbst)
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
    layout(list);
    ro.observe(list);
  }
}
