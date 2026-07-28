import { describe, expect, it } from 'vitest'
import {
  mergeFolderSongCountRefs,
  mergeLibrarySongIds,
} from '@/lib/utils/mergeLibrarySongIds'

describe('mergeLibrarySongIds', () => {
  it('keeps personal songs and adds unique linked catalog ids', () => {
    expect(
      mergeLibrarySongIds({
        personalSongIds: ['p1'],
        linkedSongIds: ['c1', 'c2'],
        personalClonedFromIds: new Map([['p1', 'c1']]),
      })
    ).toEqual(['p1', 'c2'])
  })

  it('does not duplicate when link points at same personal song id', () => {
    expect(
      mergeLibrarySongIds({
        personalSongIds: ['p1'],
        linkedSongIds: ['p1'],
        personalClonedFromIds: new Map(),
      })
    ).toEqual(['p1'])
  })

  it('hides catalog link when personal clone covers that catalog id', () => {
    expect(
      mergeLibrarySongIds({
        personalSongIds: ['clone-1', 'personal-2'],
        linkedSongIds: ['catalog-1', 'catalog-2'],
        personalClonedFromIds: new Map([
          ['clone-1', 'catalog-1'],
          ['personal-2', undefined],
        ]),
      })
    ).toEqual(['clone-1', 'personal-2', 'catalog-2'])
  })
})

describe('mergeFolderSongCountRefs', () => {
  it('counts personal folders and uncovered library links', () => {
    const counts = mergeFolderSongCountRefs({
      personal: [
        { songId: 'clone-1', folderId: 'folder-a' },
        { songId: 'personal-2', folderId: null },
      ],
      linked: [
        { songId: 'catalog-1', folderId: 'folder-b' },
        { songId: 'catalog-2', folderId: 'folder-a' },
      ],
      personalClonedFromIds: new Map([['clone-1', 'catalog-1']]),
    })

    expect(counts.get('folder-a')).toBe(2) // clone-1 + catalog-2
    expect(counts.get('null')).toBe(1) // personal-2
    expect(counts.get('folder-b')).toBeUndefined() // catalog-1 covered by clone
  })

  it('applies folder filter semantics for unorganized vs folder', () => {
    const all = mergeFolderSongCountRefs({
      personal: [{ songId: 'p1', folderId: 'f1' }],
      linked: [
        { songId: 'c1', folderId: null },
        { songId: 'c2', folderId: 'f1' },
      ],
      personalClonedFromIds: new Map(),
    })
    expect(all.get('f1')).toBe(2)
    expect(all.get('null')).toBe(1)
  })
})
