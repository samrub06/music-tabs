'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ChordBox } from 'vexchords';
import { useLanguage } from '@/context/LanguageContext';
import { MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import type { Chord } from '@/types';
import { markChordKnownAction, unmarkChordKnownAction } from './actions';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [isPending, startTransition] = useTransition();
  const chordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const chordBoxesRef = useRef<Map<string, ChordBox>>(new Map());

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
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Input - Full width on mobile */}
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                placeholder="Search chords..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Status and Difficulty Filters - Side by side on mobile, in row on desktop */}
            <div className="flex gap-3 sm:gap-4">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les accords</option>
                <option value="to-learn">À apprendre</option>
                <option value="known">Déjà connus</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes difficultés</option>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>
        </div>

        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No chords found matching your filters</p>
          </div>
        ) : (
          filteredSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {section.chords.map((chord) => {
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
          ))
        )}
      </div>
    </div>
  );
}
