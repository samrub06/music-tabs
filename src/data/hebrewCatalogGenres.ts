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
  /** בן צור — contemporary faith-pop (not Hanan Ben Ari) */
  benZur: 'hebrew-ben-zur',
  eyalGolan: 'hebrew-eyal-golan',
  omerAdam: 'hebrew-omer-adam',
  edenHason: 'hebrew-eden-hason',
  saritHadad: 'hebrew-sarit-hadad',
  moshePeretz: 'hebrew-moshe-peretz',
  nathanGoshen: 'hebrew-nathan-goshen',
  idanRaichel: 'hebrew-idan-raichel',
  shlomoArtzi: 'hebrew-shlomo-artzi',
  staticBenEl: 'hebrew-static-ben-el',
  noaKirel: 'hebrew-noa-kirel',
  itayLevi: 'hebrew-itay-levi',
  osherCohen: 'hebrew-osher-cohen',
  /** אבי אוחיון — songwriter shelf (להיטים שכתב/הלחין) */
  aviOhayon: 'hebrew-avi-ohayon',
  /** Liturgy / litani (zemirot, birkat, havdalah, etc.) */
  liturgy: 'hebrew-liturgy',
  /** Yeshiva / yeshivish choirs & style */
  yeshiva: 'hebrew-yeshiva',
  songbook: 'hebrew-songbook',
  neginaJewish: 'hebrew-negina-jewish',
  tab4uHassidic: 'hebrew-tab4u-hassidic',
} as const

export type HebrewCatalogGenre =
  (typeof HEBREW_CATALOG_GENRES)[keyof typeof HEBREW_CATALOG_GENRES]
