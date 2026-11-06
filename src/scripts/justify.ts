/**
 * Gleich hohe Reihen „wie Lightroom“ für Listen mit [data-justify].
 * Jedes Kind trägt sein Seitenverhältnis als CSS-Variable --r; die Zielhöhe einer Reihe kommt aus CSS
 * (flex-basis = --r × --row). Das Skript verteilt die Fotos so auf Reihen, dass jede Reihe die Breite füllt
 * und möglichst nah an der Zielhöhe bleibt – passt ein Foto nicht mehr ganz, wandert es in die nächste
 * Reihe oder alle werden ein wenig kleiner, je nachdem, was näher an der Zielhöhe liegt.
 * Ohne JavaScript übernimmt reines CSS (flex-grow), dann kann ein einzelnes Foto am Reihenende größer werden.
 */
function layout(list: HTMLElement) {
  const width = list.clientWidth;
  if (!width) return; // ausgeblendet (andere Ansicht)
  const items = [...list.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (!items.length) return;

  // Zielhöhe und Abstand aus dem CSS lesen
  for (const it of items) it.style.removeProperty('flex');
  const ratio = (el: HTMLElement) => Number(el.style.getPropertyValue('--r')) || 1;
  const first = items[0]!;
  const target = parseFloat(getComputedStyle(first).flexBasis) / ratio(first);
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
  if (!target || !Number.isFinite(target)) return;

  const avail = width - 0.5; // Rundungsreserve, damit nichts umbricht
  const heightFor = (sumR: number, n: number) => (avail - gap * (n - 1)) / sumR;
  const off = (h: number) => Math.abs(Math.log(h / target));

  let row: HTMLElement[] = [];
  let sumR = 0;
  const setRow = (els: HTMLElement[], h: number) => {
    for (const el of els) el.style.flex = `0 0 ${(ratio(el) * h).toFixed(2)}px`;
  };

  for (const it of items) {
    const r = ratio(it);
    row.push(it);
    sumR += r;
    if (sumR * target + gap * (row.length - 1) < avail) continue;

    // Reihe ist voll: mit diesem Foto (alle etwas kleiner) oder ohne (alle etwas größer)?
    const withIt = heightFor(sumR, row.length);
    const without = row.length > 1 ? heightFor(sumR - r, row.length - 1) : Infinity;
    if (off(without) < off(withIt)) {
      setRow(row.slice(0, -1), without);
      row = [it];
      sumR = r;
    } else {
      setRow(row, withIt);
      row = [];
      sumR = 0;
    }
  }
  // Letzte, nicht volle Reihe: in Zielhöhe, nicht gestreckt
  setRow(row, Math.min(target, heightFor(sumR, row.length)));
}

/** Alle Listen sofort neu verteilen (z. B. direkt nach dem Umschalten der Ansicht) */
export function justifyAll() {
  for (const list of document.querySelectorAll<HTMLElement>('[data-justify]')) layout(list);
}

export function initJustify() {
  const lists = document.querySelectorAll<HTMLElement>('[data-justify]');
  if (!lists.length) return;
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) layout(e.target as HTMLElement);
  });
  for (const list of lists) {
    layout(list);
    ro.observe(list);
  }
}
