/**
 * Lightbox (PhotoSwipe) für die Alben.
 * - Das Foto hat immer etwas weißen Rand, auch auf dem Handy.
 * - „Details“ (i-Symbol oder Taste I) klappt ein Feld mit Albumtitel, Nummer, Bildunterschrift und
 *   Aufnahmedaten auf: am Desktop als Spalte rechts, auf dem Handy unten. Das Foto wird dabei kleiner
 *   und rückt zur Seite bzw. nach oben – das Feld liegt nie über dem Foto.
 *   Ob die Details offen sind, merkt sich die Seite für den Besuch.
 * - „← Vorheriges Bild“ / „Nächstes Bild →“ stehen direkt über dem Foto (nicht darauf), so breit wie das Foto.
 * - Oben eine einheitliche Leiste: alle Knöpfe gleich groß, rund, gleiche Linien-Symbole; nur „Schließen“ ist gefüllt.
 * - Teilbare URL: #bild-N öffnet direkt das Foto.
 */
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import type PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import '../styles/lightbox.css';
import { de } from '../i18n/de';

const svg = (body: string) =>
  `<svg class="pswp__icn" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICON = {
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  zoom: svg(
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/><path d="M8 10.5h5"/><path class="pswp__zoom-icn-bar-v" d="M10.5 8v5"/>',
  ),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.7" r=".6" fill="currentColor"/>'),
  share: svg('<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7.5h14V12"/>'),
  download: svg('<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5"/><path d="M4 20h16"/>'),
};

const HASH = /^#bild-(\d+)$/;
const KEY = 'jd-details';
/** Ab dieser Breite stehen die Details als Spalte rechts (wie in lightbox.css) */
const WIDE = 900;
/** Breite der Detail-Spalte am Desktop (wie in lightbox.css) */
const PANEL_W = 340;
/** Höhe der Leiste oben und der Zeile mit „Vorheriges/Nächstes Bild“ (wie in lightbox.css) */
const BAR_H = 64;
const NAV_H = 48;

const ARROW = {
  prev: '<svg class="jd-step-icn" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
  next: '<svg class="jd-step-icn" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
};

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

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const e = document.createElement(tag);
  e.className = className;
  if (text) e.textContent = text;
  return e;
}

export interface LightboxOptions {
  /** Liste mit den Foto-Links (Standard: das Element mit [data-gallery]) */
  gallery?: HTMLElement | null;
  /** Teilen-Knopf und #bild-N in der Adresse (Standard: an; aus für die HQ-Alben) */
  share?: boolean;
  /** Bild selbst laden (z. B. entschlüsseln); liefert eine Bild-URL */
  loadImage?: (link: HTMLElement) => Promise<string>;
  /** Eigener Download (z. B. Original entschlüsseln) statt eines data-original-Links */
  download?: (link: HTMLElement) => Promise<void> | void;
  /** Überblenden statt aus dem Vorschaubild zoomen (wenn die Links unsichtbar sind, z. B. im Portfolio) */
  fade?: boolean;
}

export function initLightbox(opts: LightboxOptions = {}) {
  const galleryEl = opts.gallery ?? document.querySelector<HTMLElement>('[data-gallery]');
  if (!galleryEl) return;
  const shareable = opts.share !== false;
  const count = Number(galleryEl.dataset.count ?? 0);
  const albumTitle = galleryEl.dataset.title ?? document.title;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Zustand des Detail-Felds
  let open = false;
  try {
    open = sessionStorage.getItem(KEY) === '1';
  } catch {
    /* privater Modus */
  }
  let sheetH = 0; // Höhe des Felds auf dem Handy (wird gemessen)
  let panel: HTMLElement | undefined;
  let infoBtn: HTMLElement | undefined;

  /** Weißer Rand ums Foto; Leiste, Pfeil-Zeile und offene Details bekommen ihren eigenen Platz */
  const paddingFor = (viewport: { x: number; y: number }) => {
    const top = BAR_H + (count > 1 ? NAV_H : 0) + 12;
    if (viewport.x >= WIDE) {
      return { top, bottom: 40, left: 56, right: open ? PANEL_W + 40 : 56 };
    }
    const side = viewport.x < 600 ? 16 : 32;
    return { top, bottom: open ? sheetH + 16 : 24, left: side, right: side };
  };

  const lightbox = new PhotoSwipeLightbox({
    gallery: galleryEl,
    children: 'a.ph',
    pswpModule: () => import('photoswipe'),
    bgOpacity: 1,
    showHideAnimationType: reduced ? 'none' : opts.fade ? 'fade' : 'zoom',
    zoomAnimationDuration: reduced ? 0 : 333,
    closeTitle: de.lightbox.close,
    zoomTitle: de.lightbox.zoom,
    closeSVG: ICON.close,
    zoomSVG: ICON.zoom,
    // Eigene Pfeile in der Zeile über dem Foto statt auf dem Foto
    arrowPrev: false,
    arrowNext: false,
    errorMsg: de.lightbox.error,
    indexIndicatorSep: ' / ',
    paddingFn: paddingFor,
  });

  /** Inhalt des Detail-Felds für das aktuelle Foto */
  const render = (pswp: PhotoSwipe) => {
    if (!panel) return;
    const a = pswp.getItemData(pswp.currIndex).element as HTMLElement | undefined;
    panel.replaceChildren();
    const head = el('div', 'jd-d-head');
    head.append(el('p', 'jd-d-title', albumTitle), el('p', 'jd-d-num', de.image.of(pswp.currIndex + 1, count)));
    panel.append(head);
    if (!a) return;
    if (a.dataset.caption) panel.append(el('p', 'jd-d-caption', a.dataset.caption));
    let rows: [string, string][] = [];
    try {
      rows = a.dataset.details ? JSON.parse(a.dataset.details) : [];
    } catch {
      rows = [];
    }
    if (rows.length) {
      const dl = el('dl', 'jd-d-list');
      for (const [label, value] of rows) {
        const item = el('div', 'jd-d-item');
        item.append(el('dt', '', label), el('dd', '', value));
        dl.append(item);
      }
      panel.append(dl);
    }
  };

  /** Feld zeigen/verstecken und seine Höhe messen (für paddingFn) */
  const measure = (pswp: PhotoSwipe) => {
    pswp.element?.classList.toggle('jd-open', open);
    infoBtn?.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
    sheetH = open && panel && window.innerWidth < WIDE ? panel.offsetHeight : 0;
  };
  /** … und dem Foto sofort den passenden Platz geben */
  const apply = (pswp: PhotoSwipe) => {
    measure(pswp);
    pswp.updateSize(true);
  };

  const toggle = (pswp: PhotoSwipe) => {
    open = !open;
    try {
      sessionStorage.setItem(KEY, open ? '1' : '0');
    } catch {
      /* privater Modus */
    }
    apply(pswp);
  };

  /** Hinweis unten (z. B. „Link kopiert“) */
  let toast: HTMLElement | undefined;
  let toastTimer = 0;
  const showToast = (msg: string) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast?.classList.remove('is-on'), 2600);
  };

  lightbox.on('uiRegister', () => {
    const ui = lightbox.pswp?.ui;
    if (!ui) return;

    // „← Vorheriges Bild“ / „Nächstes Bild →“ über dem Foto
    ui.registerElement({
      name: 'jd-nav',
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (row, pswp) => {
        const step = (dir: 'prev' | 'next') => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `jd-step jd-step--${dir}`;
          b.title = dir === 'prev' ? de.lightbox.prev : de.lightbox.next;
          b.innerHTML = `<span class="jd-step-circle">${ARROW[dir]}</span><span class="jd-step-label">${
            dir === 'prev' ? de.lightbox.prevLabel : de.lightbox.nextLabel
          }</span>`;
          b.addEventListener('click', () => (dir === 'prev' ? pswp.prev() : pswp.next()));
          return b;
        };
        row.append(step('prev'), step('next'));

        // Direkt über die Oberkante des Fotos setzen, so breit wie das Foto (mindestens Platz für beide Beschriftungen).
        // Gerechnet wird mit der Ruhelage des Fotos, nicht mit der Animation – so steht die Zeile sofort richtig.
        const place = () => {
          const s = pswp.currSlide;
          if (!s || !s.width || !s.panAreaSize) return;
          const z = s.zoomLevels.initial;
          const w = s.width * z;
          const h = s.height * z;
          const pad = paddingFor(pswp.viewportSize);
          const imgLeft = Math.round((s.panAreaSize.x - w) / 2) + pad.left;
          const imgTop = Math.round((s.panAreaSize.y - h) / 2) + pad.top;
          const vw = pswp.viewportSize.x;
          const width = Math.min(Math.max(w, 330), vw - 32);
          const left = Math.min(Math.max(imgLeft + w / 2 - width / 2, 16), vw - 16 - width);
          row.style.left = `${left}px`;
          row.style.width = `${width}px`;
          row.style.top = `${imgTop - NAV_H}px`;
          row.classList.toggle('is-tight', width < 330);
          // Beim Hineinzoomen ausblenden, die Zeile würde sonst auf dem Foto liegen
          row.classList.toggle('is-hidden', s.currZoomLevel > z * 1.01);
        };
        pswp.on('change', place);
        pswp.on('zoomPanUpdate', place);
        pswp.on('resize', place);
      },
    });

    // Details ein-/ausklappen
    ui.registerElement({
      name: 'jd-info',
      title: de.lightbox.details,
      ariaLabel: de.lightbox.details,
      order: 7,
      isButton: true,
      html: ICON.info,
      onInit: (button) => {
        infoBtn = button;
        button.setAttribute('aria-controls', 'jd-details');
        button.setAttribute('aria-expanded', String(open));
      },
      onClick: (_e, _el, pswp) => toggle(pswp),
    });

    // Das Detail-Feld selbst
    ui.registerElement({
      name: 'jd-details',
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (box, pswp) => {
        panel = box;
        box.id = 'jd-details';
        box.setAttribute('role', 'region');
        box.setAttribute('aria-label', de.lightbox.detailsRegion);
        box.hidden = !open;
        pswp.on('change', () => {
          render(pswp);
          // Auf dem Handy kann das Feld je nach Foto höher oder niedriger sein
          if (open && window.innerWidth < WIDE && box.offsetHeight !== sheetH) apply(pswp);
        });
      },
    });

    // Bild teilen (Web Share API oder Link kopieren)
    if (shareable) ui.registerElement({
      name: 'jd-share',
      title: de.share.imageShare,
      ariaLabel: de.share.imageShare,
      order: 8,
      isButton: true,
      html: ICON.share,
      onClick: async (_e, _el, pswp) => {
        const msg = await shareOrCopy(imageUrl(pswp.currIndex), document.title);
        if (msg) showToast(msg);
      },
    });

    // Original herunterladen: eigener Download (HQ-Album) …
    if (opts.download) {
      const download = opts.download;
      ui.registerElement({
        name: 'jd-download',
        title: de.download.original,
        ariaLabel: de.download.original,
        order: 8,
        isButton: true,
        html: ICON.download,
        onClick: async (_e, _el, pswp) => {
          const link = pswp.currSlide?.data.element;
          if (!(link instanceof HTMLElement)) return;
          showToast(de.hqAlbum.preparing);
          try {
            await download(link);
          } catch {
            showToast(de.hqAlbum.failed);
          }
        },
      });
    }
    // … oder Link auf das Original (nur wenn originalUrl gesetzt)
    else ui.registerElement({
      name: 'jd-download',
      title: de.download.original,
      ariaLabel: de.download.original,
      order: 8,
      isButton: true,
      tagName: 'a',
      html: ICON.download,
      onInit: (link, pswp) => {
        const a = link as HTMLAnchorElement;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        pswp.on('change', () => {
          const url = (pswp.currSlide?.data.element as HTMLElement | undefined)?.dataset.original;
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

    // Hinweis-Zeile
    ui.registerElement({
      name: 'jd-toast',
      isButton: false,
      appendTo: 'root',
      html: '',
      onInit: (box) => {
        toast = box;
        box.setAttribute('role', 'status');
      },
    });
  });

  // Beim Öffnen: Feld füllen und messen, bevor PhotoSwipe das Foto zum ersten Mal platziert
  // (dann springt nichts während der Öffnen-Animation)
  lightbox.on('firstUpdate', () => {
    const pswp = lightbox.pswp;
    if (!pswp) return;
    render(pswp);
    measure(pswp);
  });

  // Taste I: Details ein-/ausklappen
  lightbox.on('keydown', (e) => {
    const k = e.originalEvent;
    if (k.key.toLowerCase() === 'i' && !k.metaKey && !k.ctrlKey && !k.altKey && lightbox.pswp) {
      k.preventDefault();
      toggle(lightbox.pswp);
    }
  });

  // Auf dem Handy: Feldhöhe nach Drehen/Größenänderung neu messen
  lightbox.on('resize', () => {
    const pswp = lightbox.pswp;
    if (!pswp || !open || !panel) return;
    const h = window.innerWidth < WIDE ? panel.offsetHeight : 0;
    if (h !== sheetH) apply(pswp);
  });

  // Bild selbst laden (HQ-Album: erst entschlüsseln, dann anzeigen)
  if (opts.loadImage) {
    const load = opts.loadImage;
    lightbox.on('contentLoadImage', (e) => {
      const { content } = e;
      const img = content.element;
      const link = content.data.element;
      if (!(img instanceof HTMLImageElement) || !(link instanceof HTMLElement)) return;
      e.preventDefault();
      content.state = 'loading';
      load(link)
        .then((src) => {
          img.onload = () => content.onLoaded();
          img.onerror = () => content.onError();
          img.alt = content.data.alt ?? '';
          img.src = src;
        })
        .catch(() => content.onError());
    });
  }

  // Teilbare URL: #bild-N
  lightbox.on('change', () => {
    const i = lightbox.pswp?.currIndex;
    if (i === undefined || !shareable) return;
    history.replaceState(history.state, '', `#bild-${i + 1}`);
  });
  lightbox.on('close', () => {
    if (shareable) history.replaceState(history.state, '', location.pathname + location.search);
    // Zuletzt angesehenes Foto auf der Seite zeigen (sonst zoomt die Lightbox ins Leere)
    const target = lightbox.pswp?.currSlide?.data.element;
    if (target instanceof HTMLElement) {
      const r = target.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  });

  lightbox.init();

  const openFromHash = () => {
    const m = location.hash.match(HASH);
    if (!m) return;
    const index = Number(m[1]) - 1;
    if (index >= 0 && index < count && !lightbox.pswp) {
      lightbox.loadAndOpen(index, { gallery: galleryEl });
    }
  };
  if (shareable) {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }
  return lightbox;
}
