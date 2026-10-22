/**
 * Zentrale Einstellungen der Website.
 * Alles, was du regelmäßig anpassen willst, steht hier.
 */
export const site = {
  name: 'Jesko Dorner',
  url: 'https://jeskodor.github.io',
  lang: 'de',
  ogLocale: 'de_DE',

  /** Kurzer Claim unter dem Namen (Startseite). PLATZHALTER */
  claim: 'Fotografie, Kamera und Geschichten.',
  /** Standard-Beschreibung für Suchmaschinen. PLATZHALTER */
  description:
    'Jesko Dorner – Fotografie, Kamera und Drehbuch. Portfolio mit Galerien, Filmarbeiten und Kontakt.',
  /** Berufsbezeichnung für strukturierte Daten (Schema.org Person) */
  jobTitle: 'Fotograf',

  /**
   * E-Mail wird nie im Klartext ins HTML geschrieben, sondern im Browser
   * per JavaScript zusammengesetzt (Schutz vor einfachem Scraping).
   */
  email: { user: 'jesko.dorner', domain: 'gmail.com' },
  instagram: { handle: 'JeskoDorner', url: 'https://instagram.com/JeskoDorner' },

  /** Startseiten-Hero: 'image' = ein Bild, 'slideshow' = ruhige Überblendung */
  hero: { mode: 'image' as 'image' | 'slideshow', secondsPerImage: 7 },

  /**
   * Kontaktformular (optional). Ohne Endpoint wird kein Formular angezeigt.
   * Beispiel Formspree: 'https://formspree.io/f/abcdwxyz'
   */
  contactForm: { endpoint: '' },

  /**
   * GoatCounter (optional, cookielos). Nur den Code eintragen,
   * z. B. 'jeskodor' für https://jeskodor.goatcounter.com
   */
  analytics: { goatcounter: '' },

  /** Vorformulierter Teilen-Text. {title} und {url} werden ersetzt. */
  shareText: 'Hallo! Hier sind die Bilder von „{title}“: {url}',

  /** Jahr für den Copyright-Hinweis */
  copyrightSince: 2026,
} as const;

export type Site = typeof site;
