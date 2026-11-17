/**
 * sizes-Angaben, die an zwei Stellen gleich sein müssen: im <picture> und beim Vorladen im Kopf der Seite
 * (sonst lädt der Browser das Bild zweimal).
 */
/** Startseite: Foto rechts (Laptop) bzw. über die ganze Breite (Handy) */
export const HOME_SIZES = '(min-width: 1000px) 58vw, 100vw';
export const HOME_MAX_WIDTH = 2000;
/** Portfolio: gehängtes Foto, Hochformate schmaler */
export const workSizes = (r: number) => (r < 1.2 ? '(min-width: 900px) 32vw, 90vw' : '(min-width: 900px) 46vw, 92vw');
/** Galerie-Übersicht: Titelbild einer Kachel (Breite ∝ Seitenverhältnis) */
export const cardSizes = (r: number) => `(min-width: 700px) ${Math.round(r * 330)}px, ${Math.round(Math.min(100, r * 50))}vw`;
/** Über mich: Porträt */
export const PORTRAIT_SIZES = '(min-width: 900px) 40vw, 100vw';
