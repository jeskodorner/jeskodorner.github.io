// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub-User-Site: Das Repo heißt exakt "jeskodorner.github.io",
// deshalb wird nur `site` gesetzt und kein `base`.
export default defineConfig({
  site: 'https://jeskodorner.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Unlisted-Galerien (/g/…) und die 404-Seite gehören nicht in die Sitemap.
      filter: (page) => !page.includes('/g/') && !page.endsWith('/404/'),
    }),
  ],
  devToolbar: { enabled: false },
});
