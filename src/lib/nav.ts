/** Menüpunkte – gemeinsam für die weiße Leiste (Desktop), das blaue Menü (Handy) und die Startseite. */
import { getCollection } from 'astro:content';
import { useTranslations } from '../i18n';

export interface NavLink {
  href: string;
  label: string;
  /** Pfad-Anfänge, bei denen der Punkt als „aktuell“ gilt */
  match: string[];
}

export async function navLinks(): Promise<NavLink[]> {
  const t = useTranslations();
  const hasFilms = (await getCollection('films')).length > 0;
  return [
    { href: '/portfolio/', label: t.nav.selected, match: ['/portfolio/'] },
    { href: '/galerien/', label: t.nav.galleries, match: ['/galerien/', '/g/'] },
    ...(hasFilms ? [{ href: '/film/', label: t.nav.film, match: ['/film/'] }] : []),
    { href: '/ueber-mich/', label: t.nav.about, match: ['/ueber-mich/'] },
    { href: '/kontakt/', label: t.nav.contact, match: ['/kontakt/'] },
  ];
}

export const isCurrent = (path: string, match: string[]) => match.some((m) => path.startsWith(m));
