/**
 * Fotos, die direkt hier in der Großansicht aufgehen (Mappe), ohne die Albumseite.
 * Die Seite enthält eine unsichtbare Liste [data-album-src="<slug>"] mit den Lightbox-Daten der Fotos, die dort
 * blätterbar sein sollen (in der Mappe seit 22.11.2026 nur die Fotos der Mappe, nicht das ganze Album); ein Link mit
 * data-open-album="<slug>" und data-photo="<Nummer in dieser Liste>" öffnet die Großansicht ab genau diesem Foto.
 * Ohne JavaScript öffnet der Link nur das große Bild.
 */
import { initLightbox } from './lightbox';

export function initAlbumLinks() {
  const boxes = new Map<string, { lb: NonNullable<ReturnType<typeof initLightbox>>; list: HTMLElement }>();
  for (const list of document.querySelectorAll<HTMLElement>('[data-album-src]')) {
    const lb = initLightbox({ gallery: list, share: false, fade: true });
    if (lb && list.dataset.albumSrc) boxes.set(list.dataset.albumSrc, { lb, list });
  }
  for (const a of document.querySelectorAll<HTMLAnchorElement>('[data-open-album]')) {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const box = boxes.get(a.dataset.openAlbum ?? '');
      if (!box) return;
      e.preventDefault();
      box.lb.loadAndOpen(Number(a.dataset.photo) - 1, { gallery: box.list });
    });
  }
}
