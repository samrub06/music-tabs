import type { NewSongData } from '@/types'

/** Stable id for upsert/dedup in the public catalog. */
export const FEATURED_CATALOG_SONG_SLUG = 'ki-leckha-nae'

export const FEATURED_CATALOG_SONG: NewSongData & {
  slug: string
  genre: string
  difficulty: string
  decade: number
} = {
  slug: FEATURED_CATALOG_SONG_SLUG,
  title: 'Ki Leckha Nae (כי לך נאה)',
  author: 'Shlomo feat. Eyal Allouche (שלמה / אייל אלוש)',
  key: 'C',
  genre: 'Religious Music',
  difficulty: 'Beginner',
  decade: 2020,
  songImageUrl:
    'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c0/70/63/c070636f-e797-7ac0-dc94-e2ac84cb2ca3/artwork.jpg/416x416bb.webp',
  artistImageUrl:
    'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8a/f5/3a/8af53a0c-02d3-049c-06f7-65bb450874ef/artwork.jpg/800x800vb.webp',
  versionDescription: 'feat. Eyal Allouche · Acoustic worship',
  sourceSite: 'Curated',
  tabId: `curated:${FEATURED_CATALOG_SONG_SLUG}`,
  content: `[Intro]
|     | C | G | D |
| Em  | D |

[Verse 1]
| C | G | D | Em  D |
| C | G | D | Em  D |

[Chorus 1]
| C | G | D | Em  D |
| C | G | D | Em  D |
| C |   |

[Verse 2]
|     Em | G | Am | G  D |
| Cm  Em | G | Am | G  D |
|     | G | D | Em  D |
| C |   | G |   D |
|     Em | D  C |

[Chorus]
|     G |   Em | D  C |   G |
|     D |   Em | D  C |
|     | Em | G | Am |
| C  D | Em | G | Am |

[Chorus 2]
| C  D | Em | G | Am |
| G  D | C  Em | G | Am |
| C  D | Em | G | Am |
| C  D7 |     D |

[Silence]
♩
`,
}
