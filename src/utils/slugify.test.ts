import { describe, expect, it } from 'vitest'
import { artistSlugFromAuthor, isUuid, slugify, songSlugFromTitleAuthor } from './slugify'

describe('slugify', () => {
  it('slugifies latin titles', () => {
    expect(songSlugFromTitleAuthor('Wonderwall', 'Oasis')).toBe('wonderwall-oasis')
  })

  it('keeps hebrew letters', () => {
    const slug = songSlugFromTitleAuthor('תשמח', 'יוסף קרדונר')
    expect(slug).toContain('תשמח')
    expect(slug).toContain('יוסף')
    expect(slug).not.toMatch(/\s/)
  })

  it('collapses punctuation', () => {
    expect(slugify("Don't Stop Believin'")).toBe('dont-stop-believin')
  })

  it('detects uuids', () => {
    expect(isUuid('a1b2c3d4-e5f6-4789-a012-3456789abcde')).toBe(true)
    expect(isUuid('wonderwall-oasis')).toBe(false)
  })

  it('slugifies artists', () => {
    expect(artistSlugFromAuthor('Oasis')).toBe('oasis')
  })
})
