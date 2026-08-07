/**
 * Admin/ops: map untagged catalog songs → Ultimate Guitar genre ids / curated tags.
 * Never called from user-facing paths.
 */

export type GenreTriageTarget =
  | '4' // rock
  | '14' // pop
  | '8' // metal
  | '666' // folk
  | '49' // country
  | '680' // soundtrack
  | '1787' // rnb/funk/soul
  | '1016' // religious (christian/gospel)
  | '45' // hip-hop
  | '16' // electronic
  | '216' // classical
  | '84' // jazz
  | '1781' // reggae
  | '99' // blues
  | '85' // disco
  | 'french-variete'
  | 'french-rap'
  | 'acoustic'
  | 'world-music'

type Rule = {
  genre: GenreTriageTarget
  authors: string[]
}

/** Author substring rules (normalized lowercase, accent-stripped). First match wins. */
export const GENRE_TRIAGE_AUTHOR_RULES: Rule[] = [
  {
    genre: 'french-rap',
    authors: [
      'pnl',
      'orelsan',
      'nekfeu',
      'booba',
      'bigflo',
      'damso',
      'ninho',
      'niska',
      'lomepal',
      'kaaris',
      'mc solaar',
      'suprême ntm',
      'supreme ntm',
      'oxmo puccino',
      'kery james',
      'youssoupha',
    ],
  },
  {
    genre: 'french-variete',
    authors: [
      'brassens',
      'brel',
      'aznavour',
      'cabrel',
      'goldman',
      'renaud',
      'souchon',
      'voulzy',
      'sardou',
      'gainsbourg',
      'piaf',
      'stromae',
      'angele',
      'angèle',
      'vianney',
      'calogero',
      'zazie',
      'johnny hallyday',
      'mylene farmer',
      'mylène farmer',
      'indochine',
      'noir desir',
      'noir désir',
      'telephone',
      'téléphone',
      'claude francois',
      'claude françois',
      'eddy mitchell',
      'patrick bruel',
      'kendji',
      'kendji girac',
      'enrico macias',
      'vanessa paradis',
      'slimane',
      'vitaa',
      'debut de soiree',
      'début de soirée',
      'celine dion',
      'céline dion',
      'axel bauer',
      'pascal obispo',
      'florent pagny',
      'daniel balavoine',
    ],
  },
  {
    genre: '8',
    authors: [
      'metallica',
      'slipknot',
      'iron maiden',
      'megadeth',
      'slayer',
      'pantera',
      'motorhead',
      'motörhead',
      'black sabbath',
      'ozzy',
      'sabaton',
      'system of a down',
      'korn',
      'disturbed',
      'avenged sevenfold',
      'lamb of god',
      'sepultura',
      'steve vai',
      'joe satriani',
    ],
  },
  {
    genre: '1781',
    authors: ['bob marley', 'marley', 'ub40', 'toots', 'peter tosh', 'jimmy cliff', 'shalom hanoch'],
  },
  {
    genre: '99',
    authors: [
      'bb king',
      'b.b. king',
      'muddy waters',
      'howlin',
      'john lee hooker',
      'stevie ray',
      'albert king',
      'buddy guy',
      'lightnin',
    ],
  },
  {
    genre: '84',
    authors: [
      'louis armstrong',
      'ella fitzgerald',
      'miles davis',
      'john coltrane',
      'duke ellington',
      'billie holiday',
      'nina simone',
      'frank sinatra',
      'nat king cole',
    ],
  },
  {
    genre: '16',
    authors: [
      'daft punk',
      'avicii',
      'calvin harris',
      'swedish house mafia',
      'deadmau5',
      'skrillex',
      'david guetta',
      'tiesto',
      'tiësto',
      'the chainsmokers',
      'marshmello',
    ],
  },
  {
    genre: '45',
    authors: [
      'eminem',
      'drake',
      'kanye',
      'kendrick',
      'jay-z',
      'jay z',
      'travis scott',
      'snoop',
      '50 cent',
      'nicki minaj',
      'cardi b',
      'tyler the creator',
      'childish gambino',
    ],
  },
  {
    genre: '49',
    authors: [
      'johnny cash',
      'dolly parton',
      'garth brooks',
      'shania twain',
      'keith urban',
      'luke combs',
      'chris stapleton',
      'carrie underwood',
      'willie nelson',
      'hank williams',
      'dixie chicks',
      'lady a',
    ],
  },
  {
    genre: '666',
    authors: [
      'bob dylan',
      'leonard cohen',
      'simon & garfunkel',
      'simon and garfunkel',
      'tracy chapman',
      'joni mitchell',
      'nick drake',
      'cat stevens',
      'yusuf',
      'joan baez',
      'fleet foxes',
      'mumford',
    ],
  },
  {
    genre: '14',
    authors: [
      'justin bieber',
      'taylor swift',
      'ariana grande',
      'bruno mars',
      'katy perry',
      'shawn mendes',
      'olivia rodrigo',
      'britney spears',
      'maroon 5',
      'billie eilish',
      'dua lipa',
      'harry styles',
      'one direction',
      'bts',
      'rihanna',
      'lady gaga',
      'michael jackson',
      'madonna',
      'whitney houston',
      'adele',
      'ed sheeran',
      'sam smith',
      'lewis capaldi',
      'the weeknd',
      'sia',
    ],
  },
  {
    genre: '4',
    authors: [
      'the beatles',
      'beatles',
      'rolling stones',
      'queen',
      'u2',
      'nirvana',
      'foo fighters',
      'green day',
      'radiohead',
      'oasis',
      'coldplay',
      'imagine dragons',
      'linkin park',
      'red hot chili',
      'pearl jam',
      'ac/dc',
      'acdc',
      'guns n',
      "guns n' roses",
      'bon jovi',
      'aerosmith',
      'led zeppelin',
      'pink floyd',
      'the who',
      'the doors',
      'eagles',
      'fleetwood mac',
      'the cranberries',
      'goo goo dolls',
      'the killers',
      'foster the people',
      'arctic monkeys',
      'the strokes',
      'weezer',
      'blink-182',
      'blink 182',
      'paramore',
      'fall out boy',
      'my chemical romance',
      'the police',
      'dire straits',
      'bruce springsteen',
      'tom petty',
      'john mayer',
      'jack johnson',
      'vance joy',
      'passenger',
      'the lumineers',
      'george ezra',
      'jason mraz',
      'hozier',
      'america',
      'extreme',
      'kansas',
      'lynyrd skynyrd',
      'john denver',
      'eric clapton',
      'janis joplin',
      'the turtles',
      'the supremes',
      'mac demarco',
      'eels',
      'clairo',
    ],
  },
  {
    genre: '1016',
    authors: [
      'hillsong',
      'elevation worship',
      'bethel music',
      'chris tomlin',
      'matt redman',
      'lauren daigle',
      'mercyme',
      'casting crowns',
    ],
  },
  {
    genre: 'world-music',
    authors: [
      'kamakawiwo',
      'gipsy kings',
      'manu chao',
      'buena vista',
      'cesaria',
      'cesária',
      'ofra haza',
      'tarkan',
      'shakira',
      'luis fonsi',
    ],
  },
  {
    genre: '85',
    authors: ['bee gees', 'abba', 'gloria gaynor', 'donna summer', 'kc and the sunshine', 'earth wind'],
  },
]

const HEBREW_RE = /[\u0590-\u05FF]/

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function triageGenreHeuristic(input: {
  title: string
  author: string
}): { genre: GenreTriageTarget; reason: string } | null {
  const author = normalize(input.author ?? '')
  const title = normalize(input.title ?? '')
  const blob = `${title} ${author}`

  if (HEBREW_RE.test(input.title + input.author)) {
    // Leave Hebrew nulls for classify:hebrew-playlists — do not force UG genres.
    return null
  }

  for (const rule of GENRE_TRIAGE_AUTHOR_RULES) {
    for (const needle of rule.authors) {
      const n = normalize(needle)
      if (!n) continue
      if (n.length <= 3) {
        const tokens = author.split(/[^a-z0-9]+/).filter(Boolean)
        if (tokens.includes(n)) {
          return { genre: rule.genre, reason: `author token ${needle}` }
        }
        continue
      }
      if (author.includes(n) || blob.includes(n)) {
        return { genre: rule.genre, reason: `author match ${needle}` }
      }
    }
  }

  return null
}
