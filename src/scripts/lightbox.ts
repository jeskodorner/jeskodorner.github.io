import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import '../styles/lightbox.css';
import { de } from '../i18n/de';

const ICON = {
  share:
    '<svg class="pswp__icn" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7.5h14V12"/></svg>',
  download:
    '<svg class="pswp__icn" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4 20h16"/></svg>',
};

const HASH = /^#bild-(\d+)$/;

function imageUrl(index: number) {
  return `${location.origin}${location.pathname}#bild-${index + 1}`;
}

async function shareOrCopy(url: string, title: string): Promise<string | undefined> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return undefined;
    } catch {
      return undefined;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return de.share.copied;
  } catch {
    return de.share.copyFailed;
  }
}

/** Bild-Link der großen Ansicht: trägt alle Lightbox-Daten (data-pswp-*, Bildunterschrift, EXIF) */
const mainLink = (index: number) => document.getElementById(`bild-${index + 1}`);

export function initLightbox() {
  const galleryEl = document.querySelector<HTMLElement>('[data-gallery]');
  if (!galleryEl) return;
  // Übersicht (Kacheln): eigene Links, die Daten kommen aus der großen Ansicht
  const tilesEl = document.querySelector<HTMLElement>('[data-tiles]');
  const viewRoot = galleryEl.closest<HTMLElement>('.gview');
  const inTiles = () => viewRoot?.dataset.view === 'tiles';
  const count = Number(galleryEl.dataset.count ?? 0);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lightbox = new PhotoSwipeLightbox({
    gallery: tilesEl ? [galleryEl, tilesEl] : galleryEl,
    children: 'a.ph',
    pswpModule: () => import('photoswipe'),
    bgOpacity: 1,
    // Bühne: Bilder sind per Parallax verschoben → sanft überblenden statt aus dem Vorschaubild zoomen
    // (wird in beforeOpen je nach Ansicht gesetzt)
    showHideAnimationType: reduced ? 'none' : galleryEl.dataset.layout === 'showcase' ? 'fade' : 'zoom',
    zoomAnimationDuration: reduced ? 0 : 333,
    closeTitle: de.lightbox.close,
    zoomTitle: de.lightbox.zoom,
    arrowPrevTitle: de.lightbox.prev,
    arrowNextTitle: de.lightbox.next,
    errorMsg: de.lightbox.error,
    indexIndicatorSep: ' / ',
    paddingFn: (viewport) =>
      viewport.x < 700
        ? { top: 56, bottom: 96, left: 0, right: 0 }
        : { top: 72, bottom: 104, left: 72, right: 72 },
  });

  // Kachel → Daten vom passenden Bild der großen Ansicht übernehmen
  lightbox.addFilter('domItemData', (item, _el, link) => {
    if (!link || link.dataset.pswpSrc) return item;
    const main = mainLink(Number(link.dataset.index) - 1);
    if (!main) return item;
    const d = main.dataset;
    item.src = d.pswpSrc ?? item.src;
    item.srcset = d.pswpSrcset;
    item.width = Number(d.pswpWidth);
    item.height = Number(d.pswpHeight);
    item.w = item.width;
    item.h = item.height;
    return item;
  });

  // Aus den Kacheln heraus zoomen, auf der Bühne überblenden
  lightbox.on('beforeOpen', () => {
    const pswp = lightbox.pswp;
    if (!pswp || reduced) return;
    const fromTiles = pswp.options.dataSource && 'gallery' in pswp.options.dataSource && pswp.options.dataSource.gallery === tilesEl;
    pswp.options.showHideAnimationType = fromTiles || galleryEl.dataset.layout !== 'showcase' ? 'zoom' : 'fade';
  });

  lightbox.on('uiRegister', () => {
    const ui = lightbox.pswp?.ui;
    if (!ui) return;

    // Bildunterschrift + EXIF
    ui.registerElement({
      name: 'jd-caption',
      order: 9,
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (el, pswp) => {
        el.setAttribute('aria-live', 'polite');
        const render = (status?: string) => {
          const a = mainLink(pswp.currIndex);
          el.replaceChildren();
          if (!a) return;
          const caption = a.dataset.caption;
          const exif = a.dataset.exif;
          if (caption) {
            const p = document.createElement('p');
            p.className = 'jd-caption__text';
            p.textContent = caption;
            el.append(p);
          }
          if (exif) {
            const p = document.createElement('p');
            p.className = 'jd-caption__exif';
            p.textContent = exif;
            el.append(p);
          }
          if (status) {
            const p = document.createElement('p');
            p.className = 'jd-caption__status';
            p.textContent = status;
            el.append(p);
          }
        };
        pswp.on('change', () => render());
        el.addEventListener('jd-status', (e) => render((e as CustomEvent<string>).detail));
      },
    });

    // Bild teilen (Web Share API oder Link kopieren)
    ui.registerElement({
      name: 'jd-share',
      title: de.share.imageShare,
      ariaLabel: de.share.imageShare,
      order: 8,
      isButton: true,
      html: ICON.share,
      onClick: async (_e, _el, pswp) => {
        const msg = await shareOrCopy(imageUrl(pswp.currIndex), document.title);
        if (msg) pswp.element?.querySelector('.pswp__jd-caption')?.dispatchEvent(new CustomEvent('jd-status', { detail: msg }));
      },
    });

    // Original herunterladen (nur wenn originalUrl gesetzt)
    ui.registerElement({
      name: 'jd-download',
      title: de.download.original,
      ariaLabel: de.download.original,
      order: 8,
      isButton: true,
      tagName: 'a',
      html: ICON.download,
      onInit: (el, pswp) => {
        const a = el as HTMLAnchorElement;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        pswp.on('change', () => {
          const url = mainLink(pswp.currIndex)?.dataset.original;
          if (url) {
            a.href = url;
            a.hidden = false;
          } else {
            a.removeAttribute('href');
            a.hidden = true;
          }
        });
      },
    });
  });

  // Teilbare URL: #bild-N
  lightbox.on('change', () => {
    const i = lightbox.pswp?.currIndex;
    if (i === undefined) return;
    history.replaceState(history.state, '', `#bild-${i + 1}`);
  });
  lightbox.on('close', () => {
    history.replaceState(history.state, '', location.pathname + location.search);
    // Zuletzt angesehenes Bild auf der Seite zeigen (sonst zoomt die Lightbox ins Leere)
    const el = lightbox.pswp?.currSlide?.data.element;
    if (el instanceof HTMLElement) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });

  lightbox.init();

  const openFromHash = () => {
    const m = location.hash.match(HASH);
    if (!m) return;
    const index = Number(m[1]) - 1;
    if (index >= 0 && index < count && !lightbox.pswp) {
      lightbox.loadAndOpen(index, { gallery: inTiles() && tilesEl ? tilesEl : galleryEl });
    }
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}
