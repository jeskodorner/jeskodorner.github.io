/**
 * Vorschaukarten fürs Teilen, beim Bauen als Bilddateien unter /og/… erzeugt (Aussehen: src/lib/og.ts).
 * Welche Seite welche Karte nutzt, steht in den Seiten selbst (cardImage("…")).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import portrait from '../../assets/portrait.jpg';
import { getAllGalleries, getPublicGalleries } from '../../lib/galleries';
import { getSelectedWorks } from '../../lib/showroom';
import { renderCard, type Card } from '../../lib/og';
import { getFilms } from '../../lib/films';
import { useTranslations } from '../../i18n';

export const getStaticPaths = (async () => {
  const t = useTranslations();
  const works = await getSelectedWorks();
  const publicGalleries = await getPublicGalleries();
  const all = await getAllGalleries();
  const allFilms = await getFilms();
  const films = allFilms.filter((f) => f.data.cover ?? f.data.still);
  const work = works[0];
  const newest = publicGalleries[0];

  const cards: Card[] = [
    { key: 'start', title: 'Fotografie, Kamera, Film', photo: work && { src: work.image.src, focus: work.image.focus } },
    { key: 'portfolio', title: t.selected.title, photo: work && { src: work.image.src, focus: work.image.focus } },
    { key: 'galerie', title: t.galleries.title, photo: newest && { src: newest.cover.src, focus: newest.cover.focus } },
    { key: 'film', title: t.film.title, photo: films[0] && { src: (films[0].data.cover ?? films[0].data.still)! } },
    { key: 'ueber-mich', title: t.about.title, photo: { src: portrait } },
    { key: 'kontakt', title: t.contact.title },
    { key: 'impressum', title: 'Impressum' },
    { key: 'datenschutz', title: 'Datenschutz' },
    { key: 'album-code', title: t.hqAlbum.title },
    ...all.map((g) => ({ key: `album/${g.slug}`, title: g.title, photo: { src: g.cover.src, focus: g.cover.focus } })),
    // Seite je Film: Vorschaubild der Übersicht (eigenes oder Standbild)
    ...allFilms.map((f) => {
      const img = f.data.cover ?? f.data.still;
      return { key: `film/${f.id}`, title: f.data.title, photo: img && { src: img } };
    }),
  ];
  return cards.map((card) => ({ params: { card: card.key }, props: { card } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const jpg = await renderCard((props as { card: Card }).card);
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
