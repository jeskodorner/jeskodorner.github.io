/**
 * Umschalter „Groß / Übersicht“ (Baustein ViewSwitch.astro), für Galerieseite und Galerie-Übersicht.
 * Die gemerkte Ansicht setzt schon ein kleines Inline-Skript vor dem ersten Zeichnen.
 * Einträge beider Ansichten tragen data-index="1…n"; beim Umschalten bleibt man beim selben Eintrag.
 */
type View = 'main' | 'tiles';

const headerBottom = () => document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 80;
const items = (root: HTMLElement, view: View) =>
  [...root.querySelectorAll<HTMLElement>(`.view-${view} [data-index]`)];

/** Eintrag, der gerade im Blick ist (0 = noch über der Liste) */
function currentIndex(root: HTMLElement): number {
  const top = headerBottom();
  if (root.getBoundingClientRect().top >= top) return 0;
  const vh = window.innerHeight;

  if (root.dataset.view === 'tiles') {
    // erste ganz sichtbare Kachel (Lesereihenfolge)
    const tiles = items(root, 'tiles');
    const hit =
      tiles.find((t) => {
        const r = t.getBoundingClientRect();
        return r.top >= top - 2 && r.bottom <= vh + 2;
      }) ?? tiles.find((t) => t.getBoundingClientRect().bottom > top);
    return hit ? Number(hit.dataset.index) : 0;
  }

  // Groß: Eintrag auf Höhe der Bildschirmmitte, sonst der nächstgelegene
  const mid = (top + vh) / 2;
  let best = 0;
  let bestDist = Infinity;
  for (const el of items(root, 'main')) {
    const r = el.getBoundingClientRect();
    const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (dist < bestDist) {
      bestDist = dist;
      best = Number(el.dataset.index);
      if (dist === 0) break;
    }
  }
  return best;
}

/** Eintrag Nr. `index` in der aktuellen Ansicht zeigen */
export function revealItem(index: number, mark = true) {
  const root = document.querySelector<HTMLElement>('.gview');
  if (!root) return;
  if (root.dataset.view === 'tiles') {
    const tile = root.querySelector<HTMLElement>(`.view-tiles [data-index="${index}"]`);
    if (!tile) return;
    tile.scrollIntoView({ block: 'center', behavior: 'instant' });
    if (mark) {
      tile.classList.remove('is-current');
      void tile.offsetWidth; // Animation neu starten
      tile.classList.add('is-current');
      tile.addEventListener('animationend', () => tile.classList.remove('is-current'), { once: true });
    }
  } else {
    // Galerie: #pos-N ist das Sprungziel (berücksichtigt das Einrasten der Bühne)
    const el = root.querySelector(`#pos-${index}`) ?? root.querySelector(`.view-main [data-index="${index}"]`);
    el?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

export function initViewSwitch() {
  const root = document.querySelector<HTMLElement>('.gview[data-view]');
  if (!root) return;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-view-btn]')];
  const sync = () => {
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.viewBtn === root.dataset.view));
  };
  sync();

  for (const b of buttons) {
    b.addEventListener('click', () => {
      const next = b.dataset.viewBtn as View;
      if (next === root.dataset.view) return;
      const index = currentIndex(root);
      root.dataset.view = next;
      sync();
      try {
        if (root.dataset.viewKey) sessionStorage.setItem(root.dataset.viewKey, next);
      } catch {
        /* privater Modus: dann eben nicht merken */
      }
      if (index) revealItem(index);
    });
  }
}
