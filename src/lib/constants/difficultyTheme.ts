export type DifficultyLevel = 1 | 2 | 3 | 4

export interface DifficultyTheme {
  level: DifficultyLevel
  slug: string
  activeColor: string
  trackColor: string
  bannerBg: string
  gradientClass: string
}

export const DIFFICULTY_THEMES: DifficultyTheme[] = [
  {
    level: 1,
    slug: 'absolute-beginner',
    activeColor: '#65a30d',
    trackColor: '#d9f99d',
    bannerBg: '#f7fee7',
    gradientClass: 'bg-gradient-to-br from-lime-500 to-green-600',
  },
  {
    level: 2,
    slug: 'beginner',
    activeColor: '#0d9488',
    trackColor: '#99f6e4',
    bannerBg: '#f0fdfa',
    gradientClass: 'bg-gradient-to-br from-emerald-600 to-teal-700',
  },
  {
    level: 3,
    slug: 'intermediate',
    activeColor: '#ea580c',
    trackColor: '#fed7aa',
    bannerBg: '#fff7ed',
    gradientClass: 'bg-gradient-to-br from-amber-500 to-orange-600',
  },
  {
    level: 4,
    slug: 'advanced',
    activeColor: '#e11d48',
    trackColor: '#fecdd3',
    bannerBg: '#fff1f2',
    gradientClass: 'bg-gradient-to-br from-rose-600 to-red-800',
  },
]

const themeBySlug = new Map(DIFFICULTY_THEMES.map((theme) => [theme.slug, theme]))
const themeByLevel = new Map(DIFFICULTY_THEMES.map((theme) => [theme.level, theme]))

export function getDifficultyThemeBySlug(slug: string): DifficultyTheme | undefined {
  return themeBySlug.get(slug)
}

export function getDifficultyTheme(level: DifficultyLevel): DifficultyTheme {
  return themeByLevel.get(level) ?? DIFFICULTY_THEMES[0]
}
