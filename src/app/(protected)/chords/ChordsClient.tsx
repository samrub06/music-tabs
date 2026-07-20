'use client';

import { useEffect, useId, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ChordBox } from 'vexchords';
import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, CheckCircleIcon, XMarkIcon, MusicalNoteIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { Chord } from '@/types';
import { markChordKnownAction, unmarkChordKnownAction } from './actions';
import { cn } from '@/lib/utils';
import chordVariantsFr from '@/data/chordVariants';
import { ChordPreviewCard } from '@/components/chords/ChordPreviewCard';
import { ChordVariantsModal } from '@/components/chords/ChordVariantsModal';
import {
  InstrumentToggle,
  type ChordInstrument,
} from '@/components/chords/InstrumentToggle';
import { VariantChordCard } from '@/components/chords/VariantChordCard';
import { CHORD_PREVIEW_DIAGRAM_OPTS } from '@/components/chords/chordCardDimensions';
import { hasPianoChordDiagram } from '@/utils/pianoChordAssets';
import type { ChordVariantGroup } from '@/types/chordVariants';
import { FilterChip, FilterChipRow } from '@/components/ui/filter-chip';
import { usePageHeader } from '@/context/PageHeaderContext';

const CHORDS_INSTRUMENT_STORAGE_KEY = 'chords-instrument';

const CHORDS_GRID_CLASS = 'grid grid-cols-2 gap-3 sm:gap-4';

/** One wide landscape card per row on mobile; two per row from sm up. */
const CHORDS_PIANO_GRID_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2';

const knownChordShellClass =
  'rounded-xl border border-emerald-300/80 bg-emerald-50/80 dark:border-emerald-700/50 dark:bg-emerald-950/30';

const knownToggleButtonClass =
  'absolute top-2 left-2 z-10 rounded-full p-1.5 transition-colors hover:bg-muted disabled:opacity-50';

/** Static variant carousel groups shown as grid cards (replaces duplicate DB open shapes). */
const VARIANT_GROUP_UI: Array<{
  id: string;
  searchKeys: string[];
  /** DB chord names to hide from the regular section grid (also used for known-toggle resolve). */
  hideDbNames: string[];
  /** Extra DB name aliases when symbol ≠ DB name (e.g. Fmaj7 → Fmaj7 (Barre)). */
  dbAliases?: string[];
}> = [
  { id: 'g-major', searchKeys: ['g', 'g major', 'sol', 'sol majeur'], hideDbNames: ['G Major'] },
  { id: 'c-major', searchKeys: ['c', 'c major', 'do', 'do majeur'], hideDbNames: ['C Major'] },
  {
    id: 'cmaj7',
    searchKeys: ['cmaj7', 'c maj7', 'do maj7', 'c major 7', 'do majeur 7'],
    hideDbNames: [],
  },
  {
    id: 'em-minor',
    searchKeys: ['em', 'e minor', 'e min', 'mi mineur', 'mi min'],
    hideDbNames: ['E Minor'],
  },
  {
    id: 'e-major',
    searchKeys: ['e', 'e major', 'mi', 'mi majeur', 'mi maj'],
    hideDbNames: ['E Major'],
  },
  {
    id: 'emaj7',
    searchKeys: ['emaj7', 'e maj7', 'mi maj7', 'e major 7', 'mi majeur 7'],
    hideDbNames: [],
  },
  { id: 'd-major', searchKeys: ['d', 'd major', 'ré', 're majeur'], hideDbNames: ['D Major'] },
  {
    id: 'dm-minor',
    searchKeys: ['dm', 'd minor', 'd min', 'ré mineur', 're min', 're mineur'],
    hideDbNames: ['D Minor'],
  },
  {
    id: 'd7',
    searchKeys: ['d7', 'd 7', 'ré 7', 're 7', 'd dominant 7'],
    hideDbNames: ['D7'],
  },
  {
    id: 'am-minor',
    searchKeys: ['am', 'a minor', 'a min', 'la mineur', 'la min'],
    hideDbNames: ['A Minor'],
  },
  {
    id: 'a-major',
    searchKeys: ['a', 'a major', 'la', 'la majeur', 'la maj'],
    hideDbNames: ['A Major'],
  },
  { id: 'b-major', searchKeys: ['b', 'b major', 'si', 'si majeur'], hideDbNames: ['B Major'] },
  {
    id: 'd-fsharp',
    searchKeys: ['d/f#', 'd/f', 'ré fa', 're fa'],
    hideDbNames: [],
  },
  {
    id: 'fmaj7',
    searchKeys: ['fmaj7', 'f maj7', 'fa maj7', 'f major 7'],
    hideDbNames: [],
    dbAliases: ['Fmaj7 (Barre)', 'Fmaj7'],
  },
  {
    id: 'fsharp7',
    searchKeys: ['f#7', 'f# 7', 'fa#7', 'fa dièse 7', 'f sharp 7'],
    hideDbNames: [],
    dbAliases: ['F#7'],
  },
  { id: 'fm-minor', searchKeys: ['fm', 'f minor', 'f min', 'fa mineur'], hideDbNames: ['F Minor'] },
  { id: 'bdim', searchKeys: ['bdim', 'b dim', 'si dim'], hideDbNames: [] },
  {
    id: 'bb-major',
    searchKeys: ['bb', 'bb major', 'si bémol', 'sib', 'si bemol'],
    hideDbNames: ['Bb Major'],
  },
  {
    id: 'cm-minor',
    searchKeys: ['cm', 'c minor', 'c min', 'do mineur', 'do min'],
    hideDbNames: [],
    dbAliases: ['C Minor'],
  },
  {
    id: 'cadd9',
    searchKeys: ['cadd9', 'c add9', 'do add9', 'c add 9'],
    hideDbNames: [],
  },
  { id: 'd4', searchKeys: ['d4', 'dsus4', 'ré 4', 're 4', 'd sus4'], hideDbNames: [], dbAliases: ['Dsus4'] },
  {
    id: 'em7',
    searchKeys: ['em7', 'e minor 7', 'e min 7', 'mi mineur 7', 'mi min 7'],
    hideDbNames: ['Em7'],
  },
  {
    id: 'f-major',
    searchKeys: ['f', 'f major', 'fa majeur', 'fa maj'],
    hideDbNames: ['F Major'],
  },
  {
    id: 'gm-minor',
    searchKeys: ['gm', 'g minor', 'g min', 'sol mineur', 'sol min'],
    hideDbNames: [],
    dbAliases: ['G Minor', 'G Minor (A-Shape)'],
  },
];

const HIDDEN_DB_CHORD_NAMES = new Set(
  VARIANT_GROUP_UI.flatMap((g) => g.hideDbNames)
);

interface ChordsClientProps {
  initialChords: Chord[];
  initialKnownChordIds: string[];
}

interface ChordSection {
  section: string;
  chords: Chord[];
}

type StatusFilter = 'all' | 'to-learn' | 'known';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

/** Compact key for comparing chord symbols to DB names (Am ↔ A Minor, Fmaj7 ↔ Fmaj7 (Barre)). */
function toChordKey(chord: string): string {
  if (!chord) return '';
  let normalized = chord.trim().toUpperCase();
  // Strip parenthetical suffixes: (Barre), (A-Shape), etc.
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, '');
  const enharmonicMap: Record<string, string> = {
    'C#': 'DB',
    'D#': 'EB',
    'F#': 'GB',
    'G#': 'AB',
    'A#': 'BB',
  };
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    normalized = normalized.split(sharp).join(flat);
  }
  normalized = normalized.replace(/\s+/g, '');
  normalized = normalized
    .replace(/MINOR/g, 'M')
    .replace(/MAJOR/g, '')
    .replace(/MIN(?![A-Z])/g, 'M')
    .replace(/SUS4/g, '4')
    .replace(/SUS2/g, '2');
  return normalized;
}

function resolveDbChordForGroup(group: ChordVariantGroup, chords: Chord[]): Chord | undefined {
  const cfg = VARIANT_GROUP_UI.find((g) => g.id === group.id);
  const candidateNames = [
    ...(cfg?.hideDbNames ?? []),
    ...(cfg?.dbAliases ?? []),
    group.symbol,
  ];

  for (const name of candidateNames) {
    const found = chords.find((c) => c.name === name);
    if (found) return found;
  }

  const symbolKey = toChordKey(group.symbol);
  if (!symbolKey) return undefined;

  // Prefer exact compact-key match; skip barre duplicates when an open shape exists.
  const matches = chords.filter((c) => toChordKey(c.name) === symbolKey);
  if (matches.length === 0) return undefined;
  const open = matches.find((c) => !/\(/i.test(c.name));
  return open ?? matches[0];
}

export default function ChordsClient({ 
  initialChords, 
  initialKnownChordIds
}: ChordsClientProps) {
  const { t } = useLanguage();
  usePageHeader(t('chords.pageTitle'), '/');
  const [chords] = useState<Chord[]>(initialChords);
  const [knownChordIds, setKnownChordIds] = useState<Set<string>>(new Set(initialKnownChordIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [openVariantGroupId, setOpenVariantGroupId] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<ChordInstrument>('guitar');
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chordSuggestionsListId = useId();
  const chordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chordBoxesRef = useRef<Map<string, ChordBox>>(new Map());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHORDS_INSTRUMENT_STORAGE_KEY);
      if (stored === 'piano' || stored === 'guitar') {
        setInstrument(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleInstrumentChange = (value: ChordInstrument) => {
    setInstrument(value);
    try {
      localStorage.setItem(CHORDS_INSTRUMENT_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const chordNameSuggestions = useMemo(() => {
    const q = localSearchValue.trim().toLowerCase();
    if (!q) return [];
    const uniqueNames = Array.from(new Set(chords.map((c) => c.name)));
    return uniqueNames
      .filter((name) => name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aStarts = aLower.startsWith(q);
        const bStarts = bLower.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 10);
  }, [chords, localSearchValue]);

  const showSuggestions =
    isSearchFocused && localSearchValue.trim().length > 0 && chordNameSuggestions.length > 0;

  const applyChordSearch = (value: string) => {
    setLocalSearchValue(value);
    setSearchQuery(value);
    searchInputRef.current?.blur();
    setIsSearchFocused(false);
  };

  const handleClearSearch = () => {
    setLocalSearchValue('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Debounced search - update searchQuery after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchValue]);

  // Check if a chord is known by the user (using manual list)
  const isChordKnown = (chord: Chord): boolean => {
    return knownChordIds.has(chord.id);
  };

  // Group chords by section
  const chordSections: ChordSection[] = chords.reduce((acc, chord) => {
    let section = acc.find(s => s.section === chord.section);
    if (!section) {
      section = {
        section: chord.section,
        chords: []
      };
      acc.push(section);
    }
    section.chords.push(chord);
    return acc;
  }, [] as ChordSection[]);

  // Filter chords based on search query, status, and difficulty
  const filteredSections = chordSections.map(section => {
    let filteredChords = section.chords;

    // Filter by search query
    if (searchQuery.trim()) {
      filteredChords = filteredChords.filter(chord =>
        chord.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter === 'known') {
      filteredChords = filteredChords.filter(chord => isChordKnown(chord));
    } else if (statusFilter === 'to-learn') {
      filteredChords = filteredChords.filter(chord => !isChordKnown(chord));
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filteredChords = filteredChords.filter(chord => 
        chord.difficulty === difficultyFilter
      );
    }

    if (instrument === 'piano') {
      filteredChords = filteredChords.filter((chord) => hasPianoChordDiagram(chord.name));
    }

    return {
      ...section,
      chords: filteredChords
    };
  }).filter(section => section.chords.length > 0);

  const handleToggleKnown = async (chordId: string) => {
    const isKnown = knownChordIds.has(chordId);
    
    startTransition(async () => {
      try {
        if (isKnown) {
          await unmarkChordKnownAction(chordId);
          setKnownChordIds(prev => {
            const next = new Set(prev);
            next.delete(chordId);
            return next;
          });
        } else {
          await markChordKnownAction(chordId);
          setKnownChordIds(prev => new Set(prev).add(chordId));
        }
      } catch (error) {
        console.error('Error toggling chord known status:', error);
      }
    });
  };

  useEffect(() => {
    if (instrument !== 'guitar') return;
    if (filteredSections.length === 0) return;

    // Collect all visible chord IDs
    const visibleChordIds = new Set<string>();
    filteredSections.forEach((section) => {
      section.chords.forEach((chord) => {
        visibleChordIds.add(chord.id);
      });
    });

    // Clean up ChordBox instances for chords that are no longer visible
    chordBoxesRef.current.forEach((chordBox, chordId) => {
      if (!visibleChordIds.has(chordId)) {
        chordBoxesRef.current.delete(chordId);
      }
    });

    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      filteredSections.forEach((section) => {
        section.chords.forEach((chord) => {
          const chordId = chord.id;
          const container = chordRefs.current.get(chordId);
          
          if (container) {
            // Always clear and re-render to ensure consistency
            container.innerHTML = '';
            
            // Remove old ChordBox instance if it exists
            if (chordBoxesRef.current.has(chordId)) {
              chordBoxesRef.current.delete(chordId);
            }
            
            // Create new ChordBox instance
            const chordBox = new ChordBox(container, CHORD_PREVIEW_DIAGRAM_OPTS);

            // Store the ChordBox instance
            chordBoxesRef.current.set(chordId, chordBox);

            // Draw the chord
            chordBox.draw({
              chord: chord.chordData.chord,
              position: chord.chordData.position,
              barres: chord.chordData.barres,
              tuning: chord.tuning
            });
          }
        });
      });
    }, 0);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [filteredSections, instrument]);

  const getDifficultyBadgeColor = (difficulty: string | null | undefined) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'intermediate':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (difficulty: string | null | undefined) => {
    switch (difficulty) {
      case 'beginner':
        return t('chords.difficultyBeginner');
      case 'intermediate':
        return t('chords.difficultyIntermediate');
      case 'advanced':
        return t('chords.difficultyAdvanced');
      default:
        return 'N/A';
    }
  };

  const openVariantGroup: ChordVariantGroup | null =
    openVariantGroupId != null
      ? chordVariantsFr.find((g) => g.id === openVariantGroupId) ?? null
      : null;

  const matchesChordSearch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (keys: string[]) => {
      if (!q) return true;
      return keys.some(
        (k) =>
          q === k ||
          q.startsWith(`${k} `) ||
          q.includes(k) ||
          k.includes(q)
      );
    };
  }, [searchQuery]);

  const visibleVariantGroups = useMemo(() => {
    if (difficultyFilter !== 'all' && difficultyFilter !== 'beginner') return [];
    return VARIANT_GROUP_UI.filter((cfg) => matchesChordSearch(cfg.searchKeys))
      .map((cfg) => chordVariantsFr.find((g) => g.id === cfg.id))
      .filter((g): g is ChordVariantGroup => g != null)
      .filter((g) => instrument !== 'piano' || hasPianoChordDiagram(g.symbol))
      // Only show variant cards that map to a DB chord (required for known check ✅)
      .filter((g) => resolveDbChordForGroup(g, chords) != null)
      .filter((g) => {
        if (statusFilter === 'all') return true;
        const dbChord = resolveDbChordForGroup(g, chords);
        if (!dbChord) return false;
        const known = knownChordIds.has(dbChord.id);
        return statusFilter === 'known' ? known : !known;
      });
  }, [matchesChordSearch, difficultyFilter, instrument, statusFilter, knownChordIds, chords]);

  const showVariantCards = visibleVariantGroups.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 hidden space-y-1 sm:block">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t('chords.pageTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('chords.pageHint')}</p>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative min-w-0 flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={localSearchValue}
                      onChange={(e) => setLocalSearchValue(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && chordNameSuggestions[0]) {
                          e.preventDefault();
                          applyChordSearch(chordNameSuggestions[0]);
                        }
                        if (e.key === 'Escape') {
                          setIsSearchFocused(false);
                          searchInputRef.current?.blur();
                        }
                      }}
                      placeholder={t('chords.searchPlaceholder')}
                      className="block w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:py-3 sm:pl-12 sm:pr-12"
                      autoComplete="off"
                      role="combobox"
                      aria-controls={chordSuggestionsListId}
                      aria-expanded={showSuggestions}
                      aria-autocomplete="list"
                    />
                    {localSearchValue && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center pr-3 text-muted-foreground hover:text-foreground sm:pr-4"
                        aria-label={t('common.clear')}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                    {showSuggestions && (
                      <ul
                        id={chordSuggestionsListId}
                        className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-md"
                        role="listbox"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {chordNameSuggestions.map((name) => (
                          <li key={name} role="option" aria-selected={false}>
                            <button
                              type="button"
                              className="flex min-h-[44px] w-full items-center px-4 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                              onClick={() => applyChordSearch(name)}
                            >
                              {name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <InstrumentToggle
                    value={instrument}
                    onChange={handleInstrumentChange}
                    compact
                    className="shrink-0"
                  />
                </div>
                <FilterChipRow>
                  <FilterChip
                    active={statusFilter === 'all'}
                    onClick={() => setStatusFilter('all')}
                  >
                    {t('chords.statusAll')}
                  </FilterChip>
                  <FilterChip
                    active={statusFilter === 'to-learn'}
                    onClick={() => setStatusFilter('to-learn')}
                  >
                    {t('chords.statusToLearn')}
                  </FilterChip>
                  <FilterChip
                    active={statusFilter === 'known'}
                    onClick={() => setStatusFilter('known')}
                  >
                    {t('chords.statusKnown')}
                  </FilterChip>
                </FilterChipRow>
                <FilterChipRow>
                  <FilterChip
                    active={difficultyFilter === 'all'}
                    onClick={() => setDifficultyFilter('all')}
                  >
                    {t('chords.difficultyAll')}
                  </FilterChip>
                  <FilterChip
                    active={difficultyFilter === 'beginner'}
                    onClick={() => setDifficultyFilter('beginner')}
                  >
                    {t('chords.difficultyBeginner')}
                  </FilterChip>
                  <FilterChip
                    active={difficultyFilter === 'intermediate'}
                    onClick={() => setDifficultyFilter('intermediate')}
                  >
                    {t('chords.difficultyIntermediate')}
                  </FilterChip>
                  <FilterChip
                    active={difficultyFilter === 'advanced'}
                    onClick={() => setDifficultyFilter('advanced')}
                  >
                    {t('chords.difficultyAdvanced')}
                  </FilterChip>
                </FilterChipRow>
              </div>
            </div>

            <Link
              href="/chords/progressions"
              className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <span className="inline-flex items-center gap-2">
                <MusicalNoteIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                {t('chords.showProgressions')}
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </div>

          {filteredSections.length === 0 && !showVariantCards ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center">
              <MusicalNoteIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">{t('chords.noResults')}</p>
            </div>
          ) : (
            <>
              {showVariantCards && (
                <div className="mb-10">
                  <div className={instrument === 'piano' ? CHORDS_PIANO_GRID_CLASS : CHORDS_GRID_CLASS}>
                    {visibleVariantGroups.map((group) => {
                      const dbChord = resolveDbChordForGroup(group, chords);
                      if (!dbChord) return null;
                      const chordId = dbChord.id;
                      const isKnown = knownChordIds.has(chordId);

                      return (
                        <div
                          key={group.id}
                          className={cn(
                            'relative flex w-full flex-col',
                            isKnown && knownChordShellClass
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleKnown(chordId)}
                            disabled={isPending}
                            className={knownToggleButtonClass}
                            aria-label={isKnown ? t('chords.markAsKnown') : t('chords.markAsUnknown')}
                            title={isKnown ? t('chords.iKnowIt') : t('chords.iDontKnowIt')}
                          >
                            {isKnown ? (
                              <CheckCircleIconSolid className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400" />
                            )}
                          </button>
                          <VariantChordCard
                            group={group}
                            instrument={instrument}
                            onClick={() => setOpenVariantGroupId(group.id)}
                            className={isKnown ? 'border-transparent bg-transparent shadow-none' : undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {filteredSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-10">
                  <div className={instrument === 'piano' ? CHORDS_PIANO_GRID_CLASS : CHORDS_GRID_CLASS}>
                    {section.chords
                      .filter((chord) => !HIDDEN_DB_CHORD_NAMES.has(chord.name))
                      .map((chord) => {
                        const isKnown = isChordKnown(chord);
                        return (
                          <div
                            key={chord.id}
                            className={cn(
                              'relative flex w-full flex-col',
                              isKnown && knownChordShellClass
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleKnown(chord.id)}
                              disabled={isPending}
                              className={knownToggleButtonClass}
                              aria-label={isKnown ? t('chords.markAsKnown') : t('chords.markAsUnknown')}
                              title={isKnown ? t('chords.iKnowIt') : t('chords.iDontKnowIt')}
                            >
                              {isKnown ? (
                                <CheckCircleIconSolid className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400" />
                              )}
                            </button>

                            <ChordPreviewCard
                              chordLabel={chord.name}
                              instrument={instrument}
                              diagramContainerRef={
                                instrument === 'guitar'
                                  ? (el) => {
                                      if (el) chordRefs.current.set(chord.id, el);
                                    }
                                  : undefined
                              }
                              className={cn(isKnown && 'border-transparent bg-transparent shadow-none')}
                              footer={
                                chord.difficulty ? (
                                  <span
                                    className={cn(
                                      'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                                      getDifficultyBadgeColor(chord.difficulty)
                                    )}
                                  >
                                    {getDifficultyLabel(chord.difficulty)}
                                  </span>
                                ) : undefined
                              }
                            />
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </>
          )}

          {openVariantGroup && (
            <ChordVariantsModal
              group={openVariantGroup}
              instrument={instrument}
              open
              onOpenChange={(open) => {
                if (!open) setOpenVariantGroupId(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
