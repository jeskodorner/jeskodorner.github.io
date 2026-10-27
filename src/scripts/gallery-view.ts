/**
 * Umschalter „Groß / Übersicht“ auf der Galerieseite.
 * Die gemerkte Ansicht setzt schon ein kleines Inline-Skript (GalleryGrid.astro) vor dem ersten Zeichnen.
 * Beim Umschalten bleibt man beim Bild, das man gerade angesehen hat.
 */
type View = 'main' | 'tiles';
const KEY = 'jd-ansicht';

const headerBottom = () => document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 80;
const indexOf = (el: Element) => Number(el.id.replace(/^\D+/, ''));

/** Bild, das gerade im Blick ist (0 = noch über der Galerie) */
function currentIndex(root: HTMLElement): number {
  const top = headerBottom();
  if (root.getBoundingClientRect().top >= top) return 0;
  const vh = window.innerHeight;

  if (root.dataset.view === 'tiles') {
    // erste ganz sichtbare Kachel (Lesereihenfolge)
    const tiles = [...root.querySelectorAll<HTMLElement>('.tile')];
    const hit =
      tiles.find((t) => {
        const r = t.getBoundingClientRect();
        return r.top >= top - 2 && r.bottom <= vh + 2;
      }) ?? tiles.find((t) => t.getBoundingClientRect().bottom > top);
    return hit ? indexOf(hit) : 0;
  }

  // Groß: Bild auf Höhe der Bildschirmmitte, sonst das nächstgelegene
  const mid = (top + vh) / 2;
  let best = 0;
  let bestDist = Infinity;
  for (const el of root.querySelectorAll<HTMLElement>('.view-main [id^="bild-"]')) {
    const r = el.getBoundingClientRect();
    const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (dist < bestDist) {
      bestDist = dist;
      best = indexOf(el);
      if (dist === 0) break;
    }
  }
  return best;
}

/** Bild in der aktuellen Ansicht zeigen */
export function revealImage(index: number, mark = true) {
  const root = document.querySelector<HTMLElement>('.gview');
  if (root?.dataset.view === 'tiles') {
    const tile = document.getElementById(`kachel-${index}`);
    if (!tile) return;
    tile.scrollIntoView({ block: 'center', behavior: 'instant' });
    if (mark) {
      tile.classList.remove('is-current');
      void tile.offsetWidth; // Animation neu starten
      tile.classList.add('is-current');
      tile.addEventListener('animationend', () => tile.classList.remove('is-current'), { once: true });
    }
  } else {
    document.getElementById(`pos-${index}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

export function initGalleryView() {
  const root = document.querySelector<HTMLElement>('.gview[data-view]');
  const pos = location.hash.match(/^#pos-(\d+)$/);

  if (root) {
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
          sessionStorage.setItem(KEY, next);
        } catch {
          /* privater Modus: dann eben nicht merken */
        }
        if (index) revealImage(index);
      });
    }
  }

  // „Zur Galerie“ von der Bildseite (#pos-N): zum Bild springen. Chrome macht das nach einem
  // Seitenwechsel mit View Transition nicht von selbst – und in der Übersicht gibt es #pos-N nicht.
  if (pos) revealImage(Number(pos[1]));
}
