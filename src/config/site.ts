/**
 * Zentrale Einstellungen der Website.
 * Alles, was du regelmäßig anpassen willst, steht hier.
 */
export const site = {
  name: 'Jesko Dorner',
  url: 'https://jeskodorner.de',
  lang: 'de',
  ogLocale: 'de_DE',

  /** Kurzer Claim: steht im Seitentitel der Startseite („Jesko Dorner – Fotografie“) und auf der Vorschaukarte.
   *  Bis 20.11.2026 „Fotografie, Kamera und Film.“ – jetzt nur noch Fotografie */
  claim: 'Fotografie.',
  /** Standard-Beschreibung für Suchmaschinen */
  description: 'Jesko Dorner – Fotograf. Portfolio, Galerien, Filme und Kontakt.',
  /** Berufsbezeichnung für strukturierte Daten (Schema.org Person) */
  jobTitle: 'Fotograf',

  /**
   * E-Mail wird nie im Klartext ins HTML geschrieben, sondern im Browser
   * per JavaScript zusammengesetzt (Schutz vor einfachem Scraping).
   */
  email: { user: 'kontakt', domain: 'jeskodorner.de' },
  instagram: { handle: 'JeskoDorner', url: 'https://instagram.com/JeskoDorner' },

  /**
   * HQ-Alben mit Zugangscode (Seite /album/, Hochladen mit „npm run album“, siehe README).
   * baseUrl: öffentliche Adresse des Cloudflare-R2-Buckets, z. B. 'https://pub-1234abcd.r2.dev'.
   * Leer = noch nicht eingerichtet (die Seite /album/ sagt das dann).
   */
  hqAlbums: { baseUrl: '' },



  /**
   * Kontaktformular (optional). Ohne Endpoint wird kein Formular angezeigt.
   * Beispiel Formspree: 'https://formspree.io/f/abcdwxyz'
   */
  contactForm: { endpoint: '' },

  /**
   * GoatCounter (optional, cookielos). Nur den Code eintragen,
   * z. B. 'jeskodorner' für https://jeskodorner.goatcounter.com
   */
  analytics: { goatcounter: 'jeskodorner' },

  /** Vorformulierter Teilen-Text. {title} und {url} werden ersetzt. */
  shareText: 'Hallo! Hier sind die Bilder von „{title}“: {url}',

  /** Jahr für den Copyright-Hinweis */
  copyrightSince: 2026,
} as const;

export type Site = typeof site;
