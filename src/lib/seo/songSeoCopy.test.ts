import { describe, expect, it } from 'vitest'
import { artistSeoCopy, getSongSeoLocale, songSeoCopy } from './songSeoCopy'

describe('songSeoCopy', () => {
  it('uses english copy for latin songs', () => {
    const copy = songSeoCopy({ title: 'Wonderwall', author: 'Oasis' })
    expect(copy.locale).toBe('en')
    expect(copy.title).toBe('Wonderwall Chords & Tabs by Oasis')
    expect(copy.h1).toBe('Wonderwall Chords & Tabs')
    expect(copy.ogLocale).toBe('en_US')
  })

  it('uses hebrew copy for hebrew songs', () => {
    const copy = songSeoCopy({ title: 'תשמח', author: 'יוסף קרדונר' })
    expect(copy.locale).toBe('he')
    expect(copy.title).toContain('אקורדים וטאבים של')
    expect(copy.description).toContain('אקורדים')
    expect(copy.h1).toContain('אקורדים וטאבים')
    expect(copy.ogLocale).toBe('he_IL')
    expect(copy.inLanguage).toBe('he')
  })

  it('detects hebrew from lyrics sample', () => {
    expect(
      getSongSeoLocale({
        title: 'Song',
        author: 'Artist',
        lyricsSample: 'שלום עולם',
      })
    ).toBe('he')
  })

  it('builds hebrew artist hubs', () => {
    const copy = artistSeoCopy('אישי ריבו')
    expect(copy.locale).toBe('he')
    expect(copy.title).toBe('אקורדים וטאבים של אישי ריבו')
  })
})
