/**
 * Fotos, die direkt hier ihr ganzes Album in der Lightbox öffnen (Portfolio, Mappe), ohne die Albumseite.
 * Die Seite enthält je Album eine unsichtbare Liste [data-album-src="<slug>"] mit den Lightbox-Daten aller Fotos;
 * ein Link mit data-open-album="<slug>" und data-photo="<Nummer>" öffnet das Album ab genau diesem Foto.
 * Ohne JavaScript führt der Link ins Album (#bild-<Nummer>).
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
