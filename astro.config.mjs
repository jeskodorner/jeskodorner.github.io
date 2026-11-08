// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub-User-Site (Repo "jeskodorner.github.io") mit eigener Domain jeskodorner.de,
// deshalb wird nur `site` gesetzt und kein `base`. jeskodorner.github.io leitet auf die Domain weiter.
export default defineConfig({
  site: 'https://jeskodorner.de',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Unlisted-Galerien (/g/…), das HQ-Album (/album/) und die 404-Seite gehören nicht in die Sitemap.
      filter: (page) => !page.includes('/g/') && !page.endsWith('/404/') && !page.endsWith('/album/'),
    }),
  ],
  devToolbar: { enabled: false },
});
