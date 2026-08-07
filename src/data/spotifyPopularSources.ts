/**
 * Popularity-first catalog sources.
 *
 * "Spotify" here means researching what people stream (public chart pages + AI),
 * NOT the Spotify Web API.
 */
export type SpotifyPopularMarketHint = 'IL' | 'INTL'

export type PopularResearchMode = 'chart' | 'ai'

export type SpotifyPopularSource = {
  /** Stable key for --source= CLI filter */
  key: string
  name: string
  marketHint?: SpotifyPopularMarketHint
  /** Curated playlist slug to update with scraped song_ids */
  targetSlug: string
  /** Catalog genre tag written on upserted songs */
  catalogGenre: string
  description?: string
  /**
   * chart = fetch public Spotify daily chart mirror (kworb)
   * ai = ask OpenAI to research popular tracks for this shelf
   */
  researchMode: PopularResearchMode
  /** Public chart URL when researchMode === 'chart' */
  chartUrl?: string
  /** Research brief when researchMode === 'ai' */
  aiPrompt?: string
  /**
   * When true, drop non-francophone artists (Bad Bunny, Drake, …) from researched
   * tracks. Chart FR shelves should set this — Spotify France daily mixes global hits.
   */
  frenchOnly?: boolean
}

/**
 * Top charts (web mirror of Spotify daily) + AI-researched Jewish/Israeli shelves.
 */
export const SPOTIFY_POPULAR_SOURCES: SpotifyPopularSource[] = [
  {
    key: 'top-israel',
    name: 'Top 50 — Israel',
    marketHint: 'IL',
    targetSlug: 'spotify-top-israel',
    catalogGenre: 'spotify-top-israel',
    description: 'Spotify daily Israel (public chart) → Tab4U/Negina',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/il_daily.html',
  },
  {
    key: 'top-global',
    name: 'Top 50 — Global',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-global',
    catalogGenre: 'spotify-top-global',
    description: 'Spotify daily Global (public chart) → Ultimate Guitar',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/global_daily.html',
  },
  {
    key: 'top-france',
    name: 'Top 50 — France (francophone only)',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-france',
    catalogGenre: 'spotify-top-france',
    description:
      'Spotify daily France chart filtered to francophone artists only (no Bad Bunny / US-Latin) → UG',
    researchMode: 'chart',
    chartUrl: 'https://kworb.net/spotify/country/fr_daily.html',
    frenchOnly: true,
    aiPrompt:
      'Current popular FRENCH-LANGUAGE songs by francophone artists charting or radio-hot in France (variété + melodic French rap). NEVER Bad Bunny, Drake, Karol G, Taylor Swift, Ed Sheeran, or any US/Latin English/Spanish global hit. Prefer guitar-friendly titles with Ultimate Guitar chords.',
  },
  {
    key: 'editorial-top-france-guitar',
    name: 'Top France — guitar staples (francophone)',
    marketHint: 'INTL',
    targetSlug: 'spotify-top-france',
    catalogGenre: 'spotify-top-france',
    description:
      'AI list of popular francophone tracks that actually have UG chords (fills Top France when the daily chart is tab-thin)',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'Popular FRENCH-LANGUAGE songs by francophone artists that guitarists look up on Ultimate Guitar — a “Top France for guitar” mix. Include Kendji Girac, Vianney, Patrick Bruel, Jean-Jacques Goldman, Céline Dion (French only), Angèle, Stromae, Cabrel, Gims melodic hits, Louane, Calogero. Prefer evergreen + current radio hits WITH known chord sheets. NEVER Bad Bunny, Drake, Latin reggaeton, US/UK English pop. French titles.',
  },
  {
    key: 'editorial-hassidic',
    name: 'Hassidic hits (popular)',
    marketHint: 'IL',
    targetSlug: 'hassidic',
    catalogGenre: 'hebrew-hassidic',
    description: 'AI research of popular Hassidic / חסידי hits → hassidic shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular Hassidic / חסידי Jewish songs that people stream a lot (Shwekey, Fried, Motty Steinmetz, Beri Weber, Miami Boys Choir, Zanvil Weinberger, Breslov nigunim, etc.). Prefer well-known hits with chords/tabs. Titles and artists in Hebrew when that is how they are known.',
  },
  {
    key: 'editorial-religious-il',
    name: 'Israeli religious / faith-pop (popular)',
    marketHint: 'IL',
    targetSlug: 'hassidic',
    catalogGenre: 'hebrew-hassidic',
    description:
      'AI research of popular Israeli Jewish religious & faith-pop hits → hassidic shelf (complements editorial-hassidic)',
    researchMode: 'ai',
    aiPrompt:
      'Popular Israeli Jewish religious, liturgical, and faith-pop songs people stream and play on guitar — NOT Christian worship. Include Hassidic/חסידי staples plus modern faith-pop (Ishay Ribo, Hanan Ben Ari, Ben Zur, Akiva, Yosef Karduner, Shwekey, Carlebach-style nigunim, wedding/Shabbat favorites). Prefer Hebrew titles as commonly written. Favor songs that typically have Tab4U/Negina chords.',
  },
  {
    key: 'editorial-acoustic',
    name: 'Acoustic guitar staples (popular)',
    marketHint: 'INTL',
    targetSlug: 'acoustic',
    catalogGenre: 'acoustic',
    description: 'AI research of popular acoustic / campfire guitar hits → acoustic shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular acoustic / campfire / singer-songwriter songs people play on guitar (Spotify “Acoustic Hits” vibe). Prefer Ed Sheeran, Vance Joy, Passenger, The Lumineers, George Ezra, Jason Mraz, John Mayer, Jack Johnson, Lewis Capaldi, Hozier, Tracy Chapman, Bon Iver, Oasis Wonderwall, Hallelujah, Riptide, Perfect, Photograph, Thinking Out Loud, Let Her Go, Ho Hey, I’m Yours, Fast Car, and similar staples. English titles. Favor songs that commonly have Ultimate Guitar chord sheets. Exclude heavy electronic/rap without acoustic guitar arrangements.',
  },
  {
    key: 'editorial-french-variete',
    name: 'Variété française (popular)',
    marketHint: 'INTL',
    targetSlug: 'variete-francaise',
    catalogGenre: 'french-variete',
    description: 'AI research of popular French variété / chanson → variete-francaise shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'ONLY francophone artists (France / Belgium / Quebec / Switzerland) singing in French. NEVER include Bad Bunny, Drake, Taylor Swift, Latin reggaeton, US/UK pop, or English-only hits. Popular French variété / chanson for guitar: Patrick Bruel, Jean-Jacques Goldman, Céline Dion (French songs: Pour que tu m\'aimes encore, S\'il suffisait d\'aimer, Ziggy, All by Myself ONLY if French version — prefer French titles), Kendji Girac, Vianney, Francis Cabrel, Angèle, Stromae, Louane, Calogero, Zazie, Indochine, Brel, Aznavour, Brassens, Johnny Hallyday, Mylène Farmer, Pascal Obispo, Florent Pagny. French titles as commonly written. Prefer Ultimate Guitar chord staples.',
  },
  {
    key: 'editorial-french-classics',
    name: 'Variété classics (Bruel / Goldman / Céline…)',
    marketHint: 'INTL',
    targetSlug: 'variete-francaise',
    catalogGenre: 'french-variete',
    description: 'AI research of French classics → variete-francaise (second source)',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'ONLY French-language songs by francophone artists. Focus on guitar-friendly classics and radio staples: Patrick Bruel (Casser la voix, Place des grands hommes, Qui a le droit, J\'te l\'dis quand même), Jean-Jacques Goldman (Je te donne, Encore un matin, Je marche seul, Là-bas, Puisque tu pars, Il y a, On ira, Envole-moi), Céline Dion French catalogue (Pour que tu m\'aimes encore, S\'il suffisait d\'aimer, Ziggy, Destin, Je sais pas, On ne change pas), Francis Cabrel, Michel Sardou, Pascal Obispo, Florent Pagny, Daniel Balavoine. NO English Céline hits like My Heart Will Go On. NO Bad Bunny / US / Latin. French titles only.',
  },
  {
    key: 'editorial-rap-fr',
    name: 'Rap FR (popular, guitar-playable)',
    marketHint: 'INTL',
    targetSlug: 'rap-fr',
    catalogGenre: 'french-rap',
    description: 'AI research of popular French rap with playable chords → rap-fr shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'ONLY French-language rap / urban by francophone artists. NEVER Bad Bunny, Drake, or US hip-hop. Guitar-playable melodic hits: Gims / Maître Gims, PNL, Damso, Nekfeu, Orelsan, Bigflo & Oli, Jul, Lomepal, Soprano. French titles. Prefer songs with Ultimate Guitar chords.',
  },
  {
    key: 'editorial-kendji',
    name: 'Kendji Girac (popular)',
    marketHint: 'INTL',
    targetSlug: 'kendji-girac',
    catalogGenre: 'french-kendji',
    description: 'AI research of Kendji Girac hits → kendji-girac shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Kendji Girac songs in French for guitar. Artist must be Kendji Girac / Kendji. Include: Andalouse, Color Gitano, Cool, Me Quemo, Les yeux de la mama, No Me Mires Más, Conmigo, Tu y Yo, Bebete, Tiago, Maria Maria, Dans mes bras, Habibi. Prefer French titles; exclude other artists.',
  },
  {
    key: 'editorial-goldman',
    name: 'Jean-Jacques Goldman (popular)',
    marketHint: 'INTL',
    targetSlug: 'jean-jacques-goldman',
    catalogGenre: 'french-goldman',
    description: 'AI research of JJ Goldman hits → jean-jacques-goldman shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Jean-Jacques Goldman songs for guitar. Artist must be Jean-Jacques Goldman. Include: Je te donne, Encore un matin, Je marche seul, Là-bas, Puisque tu pars, Il changeait la vie, Envole-moi, On ira, Au bout de mes rêves, Elle a fait un bébé toute seule, Quand la musique est bonne, Confidentiel, Tourne en rond. French titles only. No other artists.',
  },
  {
    key: 'editorial-bruel',
    name: 'Patrick Bruel (popular)',
    marketHint: 'INTL',
    targetSlug: 'patrick-bruel',
    catalogGenre: 'french-bruel',
    description: 'AI research of Patrick Bruel hits → patrick-bruel shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Patrick Bruel songs for guitar. Artist must be Patrick Bruel. Include: Casser la voix, Place des grands hommes, Qui a le droit, J\'te l\'dis quand même, Alors regarde, Combien de murs, Pour exister, Au Café des délices, J\'m\'attendais pas à toi. French titles only. No other artists.',
  },
  {
    key: 'editorial-celine-dion',
    name: 'Céline Dion (French songs)',
    marketHint: 'INTL',
    targetSlug: 'celine-dion',
    catalogGenre: 'french-celine-dion',
    description: 'AI research of Céline Dion French hits → celine-dion shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Céline Dion songs IN FRENCH for guitar. Artist must be Céline Dion / Celine Dion. Include ONLY French-language tracks: Pour que tu m\'aimes encore, S\'il suffisait d\'aimer, Ziggy, Destin, Je sais pas, On ne change pas, Encore un soir, Immensité, Dans un autre monde, Les yeux au ciel, Parler à mon père. NEVER include My Heart Will Go On, The Power of Love, All by Myself, or other English hits.',
  },
  {
    key: 'editorial-vianney',
    name: 'Vianney (popular)',
    marketHint: 'INTL',
    targetSlug: 'vianney',
    catalogGenre: 'french-vianney',
    description: 'AI research of Vianney hits → vianney shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Vianney songs for guitar. Artist must be Vianney. Include: Pas là, Moi aimer toi, Dumbo, La fille du sud, Beau-papa, Call on Me, Les gens sont méchants, Je te déteste, Comment on fait, On est bien comme ça, Fils à papa, Je m\'en vais (try alternate spellings if needed). French titles. No other artists. AVOID titles that miss or mis-match Ultimate Guitar: N\'avoue pas, J\'espère, Mercredi, Sans intimité, Si on allait, Le galérien, J\'ai juste besoin de lumière, Dis-moi (often matches Okoumé).',
  },
  {
    key: 'editorial-macias',
    name: 'Enrico Macias (popular)',
    marketHint: 'INTL',
    targetSlug: 'enrico-macias',
    catalogGenre: 'french-macias',
    description: 'AI research of Enrico Macias hits → enrico-macias shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Enrico Macias songs for guitar. Artist must be Enrico Macias. Include: Les filles de mon pays, Solenzara, La femme de mon ami, L\'oriental, Les gens du nord, Adieu mon pays, Chanter, La maison devant la mer, Un berger vient de tomber, Ouvre-moi la porte, Pour toutes ces raisons je t\'aime, Enfants de tous pays, Un air de liberté, Mon ami mon frère, Les millionnaires du dimanche. AVOID titles known to miss or mis-match Ultimate Guitar: Oh guitare guitare, Melisa, Toi la montagne, S\'il fallait tout donner, Non je n\'ai pas oublié (often matches Aznavour), Paris tu m\'as pris dans tes bras (empty UG content), Aime-moi (fuzzy-matches wrong title), Je t\'aimerai pour toujours (fuzzy-matches wrong title). French titles. No other artists.',
  },
  {
    key: 'editorial-cabrel',
    name: 'Francis Cabrel (popular)',
    marketHint: 'INTL',
    targetSlug: 'francis-cabrel',
    catalogGenre: 'french-cabrel',
    description: 'AI research of Francis Cabrel hits → francis-cabrel shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Francis Cabrel songs for guitar. Artist must be Francis Cabrel. Include: Je l\'aime à mourir, La corrida, Je t\'aimais je t\'aime et je t\'aimerai, Sarbacane, Rosa, C\'était l\'hiver, Petite Marie, L\'encre de tes yeux, Octobre, Tout le monde y pense, Les murs de poussière. French titles. No other artists.',
  },
  {
    key: 'editorial-hallyday',
    name: 'Johnny Hallyday (popular)',
    marketHint: 'INTL',
    targetSlug: 'johnny-hallyday',
    catalogGenre: 'french-hallyday',
    description: 'AI research of Johnny Hallyday hits → johnny-hallyday shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Johnny Hallyday songs for guitar. Artist must be Johnny Hallyday. Include: Je te promets, Allumer le feu, Laura, Quelque chose de Tennessee, L\'envie, Ma gueule, Marie, Le pénitencier, Retiens la nuit, Que je t\'aime, Sang pour sang, Vivre pour le meilleur, Gabrielle, Mirador, Noir c\'est noir, Souvenirs souvenirs, Requiem pour un fou, Derrière l\'amour, Diego libre dans sa tête (Johnny Hallyday version only — never Michel Berger). French titles. No other artists. AVOID vague titles that mis-match other artists (e.g. Un homme ça pleure pas).',
  },
  {
    key: 'editorial-aznavour',
    name: 'Charles Aznavour (popular)',
    marketHint: 'INTL',
    targetSlug: 'charles-aznavour',
    catalogGenre: 'french-aznavour',
    description: 'AI research of Charles Aznavour hits → charles-aznavour shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Charles Aznavour songs for guitar. Artist must be Charles Aznavour. Include: La Bohème, Hier encore, For me formidable, Emmenez-moi, Je m\'voyais déjà, La Mamma, She, Tous les visages de l\'amour, Mes emmerdes, Comme ils disent, Les comédiens. French titles (She may be English — prefer French). No other artists.',
  },
  {
    key: 'editorial-brel',
    name: 'Jacques Brel (popular)',
    marketHint: 'INTL',
    targetSlug: 'jacques-brel',
    catalogGenre: 'french-brel',
    description: 'AI research of Jacques Brel hits → jacques-brel shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Jacques Brel songs for guitar. Artist must be Jacques Brel. Include: Ne me quitte pas, Amsterdam, Le Plat Pays, Ces gens-là, La chanson des vieux amants, Quand on n\'a que l\'amour, Madeleine, Les Flamandes, Mathilde, Vesoul, Le Moribond. French titles. No other artists.',
  },
  {
    key: 'editorial-sardou',
    name: 'Michel Sardou (popular)',
    marketHint: 'INTL',
    targetSlug: 'michel-sardou',
    catalogGenre: 'french-sardou',
    description: 'AI research of Michel Sardou hits → michel-sardou shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Michel Sardou songs for guitar. Artist must be Michel Sardou. Include: Les lacs du Connemara, Être une femme, La maladie d\'amour, Je vais t\'aimer, Afrique adieu, En chantant, Dix ans plus tôt, Le France, Musulmanes, La java de Broadway is Aznavour — do NOT include. French titles. No other artists.',
  },
  {
    key: 'editorial-obispo',
    name: 'Pascal Obispo (popular)',
    marketHint: 'INTL',
    targetSlug: 'pascal-obispo',
    catalogGenre: 'french-obispo',
    description: 'AI research of Pascal Obispo hits → pascal-obispo shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Pascal Obispo songs for guitar. Artist must be Pascal Obispo (performer). Include: Lucie, Fan, Il faut du temps, Personne, Tombé pour elle, Sa raison d\'être, Millésime, Où et avec qui tu m\'aimes, Plus que tout au monde, Assassine, Les fleurs du bien, Rien ne dure, Ce qu\'on voit à travers mon verre, Mourir demain. French titles. No other artists. AVOID titles known to miss Ultimate Guitar: L\'important c\'est d\'aimer, Je suis en te regardant, Zinedine, 1980, Soledad, Y\'a pas d\'amour sans douleur, Femme limousine. Do NOT include songs he only wrote for others (Tu trouveras = Natasha St-Pier).',
  },
  {
    key: 'editorial-stromae',
    name: 'Stromae (popular)',
    marketHint: 'INTL',
    targetSlug: 'stromae',
    catalogGenre: 'french-stromae',
    description: 'AI research of Stromae hits → stromae shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Stromae songs for guitar. Artist must be Stromae. Include: Alors on danse, Formidable, Papaoutai, Tous les mêmes, ta fête, Carmen, Santé, L\'enfer, moules frites, Cheese. French titles. No other artists.',
  },
  {
    key: 'editorial-pagny',
    name: 'Florent Pagny (popular)',
    marketHint: 'INTL',
    targetSlug: 'florent-pagny',
    catalogGenre: 'french-pagny',
    description: 'AI research of Florent Pagny hits → florent-pagny shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Florent Pagny songs for guitar. Artist must be Florent Pagny (never Jean-Jacques Goldman, never Renee Martel). Include: Savoir aimer, Ma liberté de penser, N\'importe où, Si tu veux m\'essayer, Et un jour une femme, Chanter, L\'air du temps, Y\'a pas un homme qui soit né pour ça, Bien plus grand, Les murs porteurs, Dors, Une seule vie (Pagny), Une dernière fois, Là où je t\'emmènerai, Si tu m\'aimes, Je danse, Heureux d\'un rien, Rester vrai, Tue-moi, Crier à la vie, L\'instinct, Savoir aimer (live ok if Pagny). French titles only. No other artists. AVOID: À quoi tu sers? (Goldman — never include), Io le cantero per te (Italian), Oh happy day, Merci (often no UG), Caruso unless clearly Pagny FR version on UG, any fuzzy match to Goldman / Martel / other variété.',
  },
  {
    key: 'editorial-angele',
    name: 'Angèle (popular)',
    marketHint: 'INTL',
    targetSlug: 'angele',
    catalogGenre: 'french-angele',
    description: 'AI research of Angèle hits → angele shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Angèle songs for guitar. Artist must be Angèle (Angele) — never Dua Lipa. Include: Balance ton quoi, Tout oublier, Flou, Oui ou non, Bruxelles je t\'aime, Libre, Démons, Amour Uchronique, Ta reine, La loi de Murphy, Je veux tes yeux, Jalousie, Pensées positives, Tu me regardes, Nombreux, Tempête, Perdus, Cabaret. French titles. Fever ONLY if Angèle is the primary credited artist on UG (not Dua Lipa). No other artists. AVOID: Dua Lipa Fever, songs where she is only a featured guest, English-only tracks without FR chords, vague short titles that mis-match other artists.',
  },
  {
    key: 'editorial-indochine',
    name: 'Indochine (popular)',
    marketHint: 'INTL',
    targetSlug: 'indochine',
    catalogGenre: 'french-indochine',
    description: 'AI research of Indochine hits → indochine shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Indochine songs for guitar. Artist must be Indochine. Include: L\'aventurier, J\'ai demandé à la lune, 3e sexe, 3 nuits par semaine, Canary Bay, Tes yeux noirs, Un été français, La vie est belle, Alice & June, Nos célébrations, Le grand secret, Marilyn, Miss Paramount, College Boy, Memoria, Paradize. French titles. No other artists. AVOID: Indochine the country/region false matches, covers by other bands, English-only deep cuts without UG chords.',
  },
  {
    key: 'editorial-mylene-farmer',
    name: 'Mylène Farmer (popular)',
    marketHint: 'INTL',
    targetSlug: 'mylene-farmer',
    catalogGenre: 'french-mylene-farmer',
    description: 'AI research of Mylène Farmer hits → mylene-farmer shelf',
    researchMode: 'ai',
    frenchOnly: true,
    aiPrompt:
      'The most popular Mylène Farmer songs for guitar. Artist must be Mylène Farmer (Mylene Farmer). Include: Désenchantée, Libertine, Pourvu qu\'elles soient douces, Sans contrefaçon, Ainsi soit je, XXL, California, Rêver, L\'âme-stram-gram, Les mots, Oui mais... non, Je t\'aime mélancolie, Beyond my control, Que mon cœur lâche, C\'est une belle journée, Innamoramento. French titles. No other artists. AVOID: English-only mixes without FR chords, remix-only entries, titles that fuzzy-match unrelated artists (e.g. generic "Libertine" / "California" without Farmer).',
  },
  {
    key: 'editorial-ribo',
    name: 'Ishay Ribo (popular)',
    marketHint: 'IL',
    targetSlug: 'ishay-ribo',
    catalogGenre: 'hebrew-ribo',
    description: 'AI research of popular Ishay Ribo tracks → ishay-ribo shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Ishay Ribo (ישי ריבו) songs — his biggest hits and currently well-known tracks. Artist must be Ishay Ribo / ישי ריבו. Prefer Hebrew titles as commonly written. Include: הלב שלי, סדר העבודה, נפשי, לשוב הביתה, הנה ימים באים, לכשאשתנה, תוכו רצוף אהבה, אם ננעלו, מילים של רוח, אדון עולם, and other chart/streaming staples.',
  },
  {
    key: 'editorial-ben-zur',
    name: 'Ben Zur (popular)',
    marketHint: 'IL',
    targetSlug: 'ben-zur',
    catalogGenre: 'hebrew-ben-zur',
    description: 'AI research of popular Ben Zur tracks → ben-zur shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Ben Zur (בן צור, also Ben Tzur) songs — NOT Hanan Ben Ari. Biggest hits and current tracks: אבא, כל עכבה לטובה, נשמות צמאות, תשליך, אהבת השם, הוויה, אמונה, הכל בסדר, גאולה, אישתי, טאטע תטהר, סיפורי צדיקים, הבת של המלך, etc. Artist must be בן צור / Ben Zur. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-eyal-golan',
    name: 'Eyal Golan (popular)',
    marketHint: 'IL',
    targetSlug: 'eyal-golan',
    catalogGenre: 'hebrew-eyal-golan',
    description: 'AI research of popular Eyal Golan tracks → eyal-golan shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Eyal Golan (אייל גולן) songs — Mediterranean Israeli pop hits. Include classics and recent chart tracks: עם ישראל חי, הלב שלי, ימים יגידו, מחזיק לך את היד, בית מזכוכית, פרחים מנייר, זרה, לב של גבר, אין לי אותך, מזל, מי שמאמין, etc. Artist must be אייל גולן / Eyal Golan. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-omer-adam',
    name: 'Omer Adam (popular)',
    marketHint: 'IL',
    targetSlug: 'omer-adam',
    catalogGenre: 'hebrew-omer-adam',
    description: 'AI research of popular Omer Adam tracks → omer-adam shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Omer Adam (עומר אדם) songs — biggest hits and current tracks. Include: תל אביב, השתגע העולם, קרוב אלייך, בא לי לחגוג, חולה עלייך, שקיעות אדומות, שתיים בלילה, בן 32, פלאזה אתנה, משפחה וכבוד, צמוד צמוד, etc. Artist must be עומר אדם / Omer Adam. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-eden-hason',
    name: 'Eden Hason (popular)',
    marketHint: 'IL',
    targetSlug: 'eden-hason',
    catalogGenre: 'hebrew-eden-hason',
    description: 'AI research of popular Eden Hason tracks → eden-hason shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Eden Hason (עדן חסון) songs. Include: שמישהו יעצור אותי, שקיעות אדומות, כפיות, עיניים, אל תשברי לי את הלב, גדל לי קצת זקן, מדליקה לי הכל, אדם שבור, אהובה שלי, etc. Artist must be עדן חסון / Eden Hason. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-sarit-hadad',
    name: 'Sarit Hadad (popular)',
    marketHint: 'IL',
    targetSlug: 'sarit-hadad',
    catalogGenre: 'hebrew-sarit-hadad',
    description: 'AI research of popular Sarit Hadad tracks → sarit-hadad shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Sarit Hadad (שרית חדד) songs — Mizrahi classics and hits. Include: הייתי בגן עדן, כמו סינדרלה, כשהלב בוכה, אהבה כמו שלנו, אתה תותח, חגיגה, etc. Artist must be שרית חדד / Sarit Hadad. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-moshe-peretz',
    name: 'Moshe Peretz (popular)',
    marketHint: 'IL',
    targetSlug: 'moshe-peretz',
    catalogGenre: 'hebrew-moshe-peretz',
    description: 'AI research of popular Moshe Peretz tracks → moshe-peretz shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Moshe Peretz (משה פרץ) songs. Include: אש, הללויה, אמא, גיבור של אמא, זיקוקים, אלייך, כוס של יין, etc. Artist must be משה פרץ / Moshe Peretz. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-nathan-goshen',
    name: 'Nathan Goshen (popular)',
    marketHint: 'IL',
    targetSlug: 'nathan-goshen',
    catalogGenre: 'hebrew-nathan-goshen',
    description: 'AI research of popular Nathan Goshen tracks → nathan-goshen shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Nathan Goshen (נתן גושן) songs. Include: כל מה שיש לי, מה אם נתנשק, שני ילדים בעולם, גבולות הגיון, דברי איתי יותר, איפה את, 26, etc. Artist must be נתן גושן / Nathan Goshen. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-idan-raichel',
    name: 'Idan Raichel (popular)',
    marketHint: 'IL',
    targetSlug: 'idan-raichel',
    catalogGenre: 'hebrew-idan-raichel',
    description: 'AI research of popular Idan Raichel tracks → idan-raichel shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Idan Raichel Project (הפרויקט של עידן רייכל) songs. Include: ממעמקים, שאריות של החיים, בלילה, אם תלך, שושנים עצובות, הינך יפה, מילים יפות מאלה, בואי, מכל האהבות, etc. Artist must be עידן רייכל / Idan Raichel. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-shlomo-artzi',
    name: 'Shlomo Artzi (popular)',
    marketHint: 'IL',
    targetSlug: 'shlomo-artzi',
    catalogGenre: 'hebrew-shlomo-artzi',
    description: 'AI research of popular Shlomo Artzi tracks → shlomo-artzi shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Shlomo Artzi (שלמה ארצי) songs — Israeli classics. Include: היא לא יודעת מה עובר עלי, ירח, אבסורד, אהבתיה, ארץ חדשה, תתארו לכם, מנגב לך את הדמעות, etc. Artist must be שלמה ארצי / Shlomo Artzi. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-static-ben-el',
    name: 'Static & Ben El (popular)',
    marketHint: 'IL',
    targetSlug: 'static-ben-el',
    catalogGenre: 'hebrew-static-ben-el',
    description: 'AI research of popular Static & Ben El tracks → static-ben-el shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Static & Ben El (סטטיק ובן אל תבורי) songs. Include: סלסולים, זהב, טודו בום, ברבי, אפס מאמץ, הכל לטובה, נמסטה, גומיגם, etc. Artist must be סטטיק / בן אל תבורי / Static & Ben El. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-noa-kirel',
    name: 'Noa Kirel (popular)',
    marketHint: 'IL',
    targetSlug: 'noa-kirel',
    catalogGenre: 'hebrew-noa-kirel',
    description: 'AI research of popular Noa Kirel tracks → noa-kirel shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Noa Kirel (נועה קירל) songs. Include: פנתרה, מיליון דולר, פאוץ, בנות כמוני לא בוכות, Unicorn, אם אתה גבר, או לה פופה, כל מה שאני רוצה, בריידזילה, אמבולנס, פרובוקטיבית, טרילילי טרללה, יהלומים. Artist must be נועה קירל / Noa Kirel. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-itay-levi',
    name: 'Itay Levi (popular)',
    marketHint: 'IL',
    targetSlug: 'itay-levi',
    catalogGenre: 'hebrew-itay-levi',
    description: 'AI research of popular Itay Levi tracks → itay-levi shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Itay Levi (איתי לוי) songs. Include: מערב ראשון, קירות, אין לי מקום אחר, שתישרף האהבה, נחלת בנימין, הטעות הכי יפה, חולה ירח, מרכז תל אביב, חתונת השנה, פרח בשממה, חצי בשבילי. Artist must be איתי לוי / Itay Levi. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-osher-cohen',
    name: 'Osher Cohen (popular)',
    marketHint: 'IL',
    targetSlug: 'osher-cohen',
    catalogGenre: 'hebrew-osher-cohen',
    description: 'AI research of popular Osher Cohen tracks → osher-cohen shelf',
    researchMode: 'ai',
    aiPrompt:
      'The most popular / streamed Osher Cohen (אושר כהן) songs. Include: אהבה, פלסטרים, מנגן ושר, אין אותי, ככה וככה, אני פה, לופ, כולם גנבים, ברגעים שאת הולכת, באמת של האמת, תרקדי, גיטרה ולנשום. Artist must be אושר כהן / Osher Cohen. Prefer Hebrew titles.',
  },
  {
    key: 'editorial-avi-ohayon',
    name: 'Avi Ohayon (popular songwriter)',
    marketHint: 'IL',
    targetSlug: 'avi-ohayon',
    catalogGenre: 'hebrew-avi-ohayon',
    description: 'AI research of popular Avi Ohayon–written hits → avi-ohayon shelf',
    researchMode: 'ai',
    aiPrompt:
      'Popular Israeli hits written/composed by Avi Ohayon (אבי אוחיון) — he is primarily a songwriter, not a front-line singer. Prefer well-known streamed tracks he wrote: דרך השלום (פאר טסי), תבואי היום (אייל גולן), רסיסים (רביב כנר), קירות (איתי לוי), תפסת לי מקום (בניה ברבי), תל אביב בלילה (עדן בן זקן), מביט מהצד / אז הלכתי / חצי דפוק (עומר אדם), מה עבר עליי (עדן חסון), קו הדממה / שירים וחלומות (his own). Titles in Hebrew; artist field may be the performer.',
  },
]

export function getSpotifyPopularSource(
  key: string
): SpotifyPopularSource | undefined {
  return SPOTIFY_POPULAR_SOURCES.find((s) => s.key === key)
}

export function listConfiguredSpotifyPopularSources(): SpotifyPopularSource[] {
  return SPOTIFY_POPULAR_SOURCES.filter((s) => {
    if (s.researchMode === 'chart') return Boolean(s.chartUrl?.trim())
    return Boolean(s.aiPrompt?.trim())
  })
}
