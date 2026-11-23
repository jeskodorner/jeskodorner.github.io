// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { albumRedirects } from './scripts/lib/album-addresses.mjs';

// GitHub-User-Site (Repo "jeskodorner.github.io") mit eigener Domain jeskodorner.de,
// deshalb wird nur `site` gesetzt und kein `base`. jeskodorner.github.io leitet auf die Domain weiter.
export default defineConfig({
  site: 'https://jeskodorner.de',
  trailingSlash: 'always',
  // Stylesheets direkt in jede Seite schreiben: kein eigener Abruf vor dem ersten Bild (schneller beim ersten Besuch)
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      // Unlisted-Galerien (/g/…), das HQ-Album (/album/) und die 404-Seite gehören nicht in die Sitemap.
      filter: (page) => !page.includes('/g/') && !page.endsWith('/404/') && !page.endsWith('/album/'),
    }),
  ],
  devToolbar: { enabled: false },
  // Umbenannte Alben: alte Adressen leiten weiter (GitHub Pages kann keine echten Weiterleitungen, Astro legt dafür kleine
  // Seiten an, die sofort weiterspringen)
  // Seit 23.11.2026 automatisch: wird im CMS die Adresse eines Albums geändert, merkt sich scripts/slug-history.mjs die
  // alte (src/content/alte-adressen.json) und sie leitet hierüber weiter.
  redirects: {
    '/galerien/einzelbilder/': '/galerien/museum-mit-freundinnen/',
    '/mappe/einzelbilder/': '/mappe/museum-mit-freundinnen/',
    ...(await albumRedirects(process.cwd())),
  },
});
