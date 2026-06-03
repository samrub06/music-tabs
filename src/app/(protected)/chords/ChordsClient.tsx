'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { ChordBox } from 'vexchords';
import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { Chord } from '@/types';
import { markChordKnownAction, unmarkChordKnownAction } from './actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import chordVariantsFr from '@/data/chordVariants';
import { ChordVariantsModal } from '@/components/chords/ChordVariantsModal';
import { VariantChordCard } from '@/components/chords/VariantChordCard';
import type { ChordVariantGroup } from '@/types/chordVariants';

/** Static variant carousel groups shown as grid cards (replaces duplicate DB open shapes). */
const VARIANT_GROUP_UI: Array<{
  id: string;
  searchKeys: string[];
  hideDbNames: string[];
}> = [
  { id: 'g-major', searchKeys: ['g', 'g major', 'sol', 'sol majeur'], hideDbNames: ['G Major'] },
  { id: 'c-major', searchKeys: ['c', 'c major', 'do', 'do majeur'], hideDbNames: ['C Major'] },
  {
    id: 'em-minor',
    searchKeys: ['em', 'e minor', 'e min', 'mi mineur', 'mi min'],
    hideDbNames: ['E Minor'],
  },
  { id: 'd-major', searchKeys: ['d', 'd major', 'ré', 're majeur'], hideDbNames: ['D Major'] },
  {
    id: 'am-minor',
    searchKeys: ['am', 'a minor', 'a min', 'la mineur', 'la min'],
    hideDbNames: ['A Minor'],
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
  },
  {
    id: 'cadd9',
    searchKeys: ['cadd9', 'c add9', 'do add9', 'c add 9'],
    hideDbNames: [],
  },
  { id: 'd4', searchKeys: ['d4', 'dsus4', 'ré 4', 're 4', 'd sus4'], hideDbNames: [] },
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

// Normalize chord name for comparison
function normalizeChordName(chord: string): string {
  if (!chord) return '';
  let normalized = chord.trim().toUpperCase();
  const enharmonicMap: { [key: string]: string } = {
    'C#': 'DB', 'D#': 'EB', 'F#': 'GB', 'G#': 'AB', 'A#': 'BB'
  };
  for (const [sharp, flat] of Object.entries(enharmonicMap)) {
    if (normalized.startsWith(sharp)) {
      normalized = normalized.replace(sharp, flat);
      break;
    }
  }
  return normalized;
}

export default function ChordsClient({ 
  initialChords, 
  initialKnownChordIds
}: ChordsClientProps) {
  const { t } = useLanguage();
  const [chords, setChords] = useState<Chord[]>(initialChords);
  const [knownChordIds, setKnownChordIds] = useState<Set<string>>(new Set(initialKnownChordIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [openVariantGroupId, setOpenVariantGroupId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const chordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chordBoxesRef = useRef<Map<string, ChordBox>>(new Map());

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
    // Render all chords after sections are set
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
            const chordBox = new ChordBox(container, {
              width: 130,
              height: 150,
              defaultColor: '#444',
              showTuning: true
            });

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
  }, [filteredSections]);

  const getDifficultyBadgeColor = (difficulty: string | null | undefined) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      .filter((g): g is ChordVariantGroup => g != null);
  }, [matchesChordSearch, difficultyFilter]);

  const showVariantCards = visibleVariantGroups.length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-3">
          {/* Search with chord name autocomplete */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
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
              className="block min-h-[44px] w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:pl-12 sm:pr-12 sm:text-base sm:placeholder:text-base"
              autoComplete="off"
              role="combobox"
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
                className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-md"
                role="listbox"
                onMouseDown={(e) => e.preventDefault()}
              >
                {chordNameSuggestions.map((name) => (
                  <li key={name} role="option">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full min-h-[44px] items-center px-4 py-2.5 text-left text-sm',
                        'hover:bg-muted focus:bg-muted focus:outline-none'
                      )}
                      onClick={() => applyChordSearch(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Status + difficulty — shadcn selects below search */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('chords.statusAll')}</SelectItem>
                <SelectItem value="to-learn">{t('chords.statusToLearn')}</SelectItem>
                <SelectItem value="known">{t('chords.statusKnown')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={(v) => setDifficultyFilter(v as DifficultyFilter)}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-border bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('chords.difficultyAll')}</SelectItem>
                <SelectItem value="beginner">{t('chords.difficultyBeginner')}</SelectItem>
                <SelectItem value="intermediate">{t('chords.difficultyIntermediate')}</SelectItem>
                <SelectItem value="advanced">{t('chords.difficultyAdvanced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredSections.length === 0 && !showVariantCards ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t('chords.noResults')}</p>
          </div>
        ) : (
          <>
            {showVariantCards && (
              <div className="mb-12">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {visibleVariantGroups.map((group) => (
                    <VariantChordCard
                      key={group.id}
                      group={group}
                      onClick={() => setOpenVariantGroupId(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          {filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {section.chords
                  .filter((chord) => !HIDDEN_DB_CHORD_NAMES.has(chord.name))
                  .map((chord) => {
                  const isKnown = isChordKnown(chord);
                  return (
                    <div
                      key={chord.id}
                      className={`relative flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border transition-shadow ${
                        isKnown 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 hover:shadow-md'
                      }`}
                    >
                      {/* Known Toggle Button */}
                      <button
                        onClick={() => handleToggleKnown(chord.id)}
                        disabled={isPending}
                        className="absolute top-2 left-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 z-10"
                        aria-label={isKnown ? t('chords.markAsKnown') : t('chords.markAsUnknown')}
                        title={isKnown ? t('chords.iKnowIt') : t('chords.iDontKnowIt')}
                      >
                        {isKnown ? (
                          <CheckCircleIconSolid className="h-5 w-5 text-green-600" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5 text-gray-400 hover:text-green-600" />
                        )}
                      </button>

                      <div
                        ref={(el) => {
                          if (el) {
                            chordRefs.current.set(chord.id, el);
                          }
                        }}
                        className="mb-2"
                      />
                      <div className="text-sm font-medium text-gray-700 text-center mb-1">
                        {chord.name}
                      </div>
                      {/* Difficulty Badge */}
                      {chord.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyBadgeColor(chord.difficulty)}`}>
                          {getDifficultyLabel(chord.difficulty)}
                        </span>
                      )}
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
