import type { APIRoute } from 'astro';

// Unlisted-Galerien (/g/…) werden bewusst NICHT per Disallow gesperrt:
// Das würde den Pfad öffentlich machen, und Suchmaschinen könnten das noindex-Tag nicht lesen.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
