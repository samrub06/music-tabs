export type Language = 'en' | 'fr' | 'he'

const HEBREW_REGEX = /[\u0590-\u05FF]/

export function isRtlLanguage(language: Language): boolean {
  return language === 'he'
}

export function containsHebrew(text: string): boolean {
  return HEBREW_REGEX.test(text)
}

export function getTextDirection(text: string): 'rtl' | 'ltr' {
  return containsHebrew(text) ? 'rtl' : 'ltr'
}

export function applyDocumentLanguage(language: Language): void {
  if (typeof document === 'undefined') return

  const html = document.documentElement
  const rtl = isRtlLanguage(language)

  html.lang = language
  html.dir = rtl ? 'rtl' : 'ltr'
}

/** Align text to the UI reading edge (right in RTL, left in LTR). Use for list titles regardless of script. */
export const UI_TEXT_ALIGN = 'text-start' as const
