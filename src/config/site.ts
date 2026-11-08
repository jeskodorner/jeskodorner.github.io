/**
 * Zentrale Einstellungen der Website.
 * Alles, was du regelmäßig anpassen willst, steht hier.
 */
export const site = {
  name: 'Jesko Dorner',
  url: 'https://jeskodorner.de',
  lang: 'de',
  ogLocale: 'de_DE',

  /** Kurzer Claim unter dem Namen (Startseite). PLATZHALTER */
  claim: 'Fotografie, Kamera und Film.',
  /** Standard-Beschreibung für Suchmaschinen. PLATZHALTER */
  description:
    'Jesko Dorner – Fotografie, Kamera und Film. Portfolio mit Galerien, Filmarbeiten und Kontakt.',
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

  /** Startseite: Karussell neben dem Namen – Sekunden pro Foto (Fotos = „Portfolio“) */
  hero: { secondsPerImage: 4.5 },

  /** Startseite: Abschnitt „Über mich“ (Porträt + Teaser) anzeigen? true = an, false = aus */
  home: { aboutTeaser: false as boolean },

  /**
   * Kontaktformular (optional). Ohne Endpoint wird kein Formular angezeigt.
   * Beispiel Formspree: 'https://formspree.io/f/abcdwxyz'
   */
  contactForm: { endpoint: '' },

  /**
   * GoatCounter (optional, cookielos). Nur den Code eintragen,
   * z. B. 'jeskodorner' für https://jeskodorner.goatcounter.com
   */
  analytics: { goatcounter: '' },

  /** Vorformulierter Teilen-Text. {title} und {url} werden ersetzt. */
  shareText: 'Hallo! Hier sind die Bilder von „{title}“: {url}',

  /** Jahr für den Copyright-Hinweis */
  copyrightSince: 2026,
} as const;

export type Site = typeof site;
