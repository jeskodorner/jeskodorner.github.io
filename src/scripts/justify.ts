/**
 * Gleich hohe Reihen „wie Lightroom“ für Listen mit [data-justify].
 * Jedes Kind trägt sein Seitenverhältnis als CSS-Variable --r; die Zielhöhe einer Reihe kommt aus CSS
 * (flex-basis = --r × --row). Das Skript verteilt die Fotos so auf Reihen, dass jede Reihe die Breite füllt
 * und möglichst nah an der Zielhöhe bleibt – passt ein Foto nicht mehr ganz, wandert es in die nächste
 * Reihe oder alle werden ein wenig kleiner, je nachdem, was näher an der Zielhöhe liegt.
 *
 * [data-justify="vary"] („Hängung“): Hochformate werden größer als die Querformate ihrer Reihe, damit sie
 * nicht winzig wirken (ungefähr gleiche Fläche wie ein Querformat). Sie stehen dann über – je Reihe abwechselnd
 * nach unten, nach oben oder nach beiden Seiten. Die Reihe füllt trotzdem die Breite.
 *
 * Ohne JavaScript übernimmt reines CSS (flex-grow), dann kann ein einzelnes Foto am Reihenende größer werden.
 */

/** Größe eines Fotos für „vary“ (1 = normal): Hochformat so viel größer, dass seine Fläche etwa der eines
 *  4:3-Querformats entspricht – höchstens anderthalbmal so hoch. Querformate und Quadrate bleiben bei 1. */
const sizeFor = (r: number) => (r < 0.95 ? Math.min(1.5, Math.sqrt(1.33 / r)) : 1);
/** Ausrichtung der normalen Fotos in einer Reihe mit großem Foto → großes steht unten / oben / beidseitig über */
const ALIGN = ['flex-start', 'flex-end', 'center'] as const;

function layout(list: HTMLElement) {
  const width = list.clientWidth;
  if (!width) return; // ausgeblendet (andere Ansicht)
  const items = [...list.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (!items.length) return;
  const vary = list.dataset.justify === 'vary';

  // Zielhöhe und Abstand aus dem CSS lesen
  for (const it of items) it.style.removeProperty('flex');
  const ratio = (el: HTMLElement) => Number(el.style.getPropertyValue('--r')) || 1;
  const first = items[0]!;
  const target = parseFloat(getComputedStyle(first).flexBasis) / ratio(first);
  const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
  if (!target || !Number.isFinite(target)) return;

  // Breite eines Fotos pro Pixel Reihenhöhe: Seitenverhältnis × Größe
  const sizes = items.map((el) => (vary ? sizeFor(ratio(el)) : 1));
  const size = (i: number) => sizes[i]!;
  const units = items.map((el, i) => ratio(el) * size(i));

  const avail = width - 0.5; // Rundungsreserve, damit nichts umbricht
  const heightFor = (sum: number, n: number) => (avail - gap * (n - 1)) / sum;
  const off = (h: number) => Math.abs(Math.log(h / target));

  const rows: { idx: number[]; h: number }[] = [];
  let row: number[] = [];
  let sum = 0;

  items.forEach((_, i) => {
    const u = units[i]!;
    row.push(i);
    sum += u;
    if (sum * target + gap * (row.length - 1) < avail) return;

    // Reihe ist voll: mit diesem Foto (alle etwas kleiner) oder ohne (alle etwas größer)?
    const withIt = heightFor(sum, row.length);
    const without = row.length > 1 ? heightFor(sum - u, row.length - 1) : Infinity;
    if (off(without) < off(withIt)) {
      rows.push({ idx: row.slice(0, -1), h: without });
      row = [i];
      sum = u;
    } else {
      rows.push({ idx: row, h: withIt });
      row = [];
      sum = 0;
    }
  });
  // Letzte, nicht volle Reihe: in Zielhöhe, nicht gestreckt
  if (row.length) rows.push({ idx: row, h: Math.min(target, heightFor(sum, row.length)) });

  let mixed = 0; // Reihen mit großem Foto, für die abwechselnde Ausrichtung
  for (const { idx, h } of rows) {
    const hasBig = idx.some((i) => size(i) > 1);
    const align = hasBig ? ALIGN[mixed++ % ALIGN.length]! : '';
    for (const i of idx) {
      const el = items[i]!;
      el.style.flex = `0 0 ${(units[i]! * h).toFixed(2)}px`;
      if (align && size(i) === 1) el.style.alignSelf = align;
      else el.style.removeProperty('align-self');
    }
  }
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
