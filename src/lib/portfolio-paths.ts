/**
 * Fotos im Portfolio werden im CMS (Pages CMS) per Klick aus den Alben gewählt; gespeichert wird dann ein Pfad wie
 * „/alben/hoodie/images/dsc01421.jpg“ (Medienquelle „alben“ in .pages.yml). Von Hand reicht auch der Dateiname.
 */
/** „/alben/hoodie/images/dsc01421.jpg“ → „dsc01421.jpg“ */
export const fileOf = (p?: string) => (p ? p.trim().split('/').pop() || undefined : undefined);
/** „/alben/hoodie/images/dsc01421.jpg“ → „hoodie“ (Ordner des Albums), sonst undefined */
export const folderOf = (p?: string) => {
  const m = /(?:^|\/)([^/]+)\/images\/[^/]+$/.exec(p?.trim() ?? '');
  return m?.[1];
};
