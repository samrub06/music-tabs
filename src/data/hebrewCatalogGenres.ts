/** Catalog genre tags for Hebrew / Jewish library content (no seed data). */
export const HEBREW_CATALOG_GENRES = {
  chabad: 'hebrew-chabad',
  hassidic: 'hebrew-hassidic',
  carlebach: 'hebrew-carlebach',
  moroccan: 'hebrew-moroccan',
  tunisian: 'hebrew-tunisian',
  modern: 'hebrew-modern',
  classicIsraeli: 'hebrew-classic-israeli',
  karduner: 'hebrew-karduner',
  akiva: 'hebrew-akiva',
  ribo: 'hebrew-ribo',
  hananBenAri: 'hebrew-hanan-ben-ari',
  aharonRazel: 'hebrew-aharon-razel',
  eviatarBanai: 'hebrew-eviatar-banai',
  shuliRand: 'hebrew-shuli-rand',
  songbook: 'hebrew-songbook',
  neginaJewish: 'hebrew-negina-jewish',
  tab4uHassidic: 'hebrew-tab4u-hassidic',
} as const

export type HebrewCatalogGenre =
  (typeof HEBREW_CATALOG_GENRES)[keyof typeof HEBREW_CATALOG_GENRES]
