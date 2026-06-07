'use client';

import type { Chord } from '@/types';
import type { UserChordProgress } from '@/lib/services/userChordAnalysis';
import { useLanguage } from '@/context/LanguageContext';

interface LearningPathProps {
  chords: Chord[];
  progress: UserChordProgress;
  knownChordIds: Set<string>;
}

export default function LearningPath({ chords, progress, knownChordIds }: LearningPathProps) {
  const { t } = useLanguage();

  const isChordKnown = (chord: Chord): boolean => {
    return knownChordIds.has(chord.id);
  };

  const difficultyLabel = (difficulty: string | null | undefined) => {
    if (difficulty === 'beginner') return t('learningPath.BEGINNER');
    if (difficulty === 'intermediate') return t('learningPath.INTERMEDIATE');
    if (difficulty === 'advanced') return t('learningPath.ADVANCED');
    return difficulty ?? '';
  };

  const nextChordsToLearn = chords
    .filter(chord => !isChordKnown(chord))
    .sort((a, b) => {
      const orderA = a.learningOrder ?? 9999;
      const orderB = b.learningOrder ?? 9999;
      return orderA - orderB;
    })
    .slice(0, 5);

  const getProgressPercentage = (known: number, total: number) => {
    return total > 0 ? Math.round((known / total) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('learningPath.TITLE')}</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{t('learningPath.OVERALL_PROGRESS')}</span>
          <span className="text-sm font-bold text-blue-600">{progress.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {t('learningPath.KNOWN_CHORDS_COUNT')
            .replace('{known}', String(progress.totalKnown))
            .replace('{total}', String(progress.totalChords))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('learningPath.BEGINNER')}</span>
            <span className="text-xs font-bold text-green-600">
              {getProgressPercentage(progress.knownByDifficulty.beginner, progress.totalByDifficulty.beginner)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ 
                width: `${getProgressPercentage(progress.knownByDifficulty.beginner, progress.totalByDifficulty.beginner)}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {progress.knownByDifficulty.beginner} / {progress.totalByDifficulty.beginner}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('learningPath.INTERMEDIATE')}</span>
            <span className="text-xs font-bold text-yellow-600">
              {getProgressPercentage(progress.knownByDifficulty.intermediate, progress.totalByDifficulty.intermediate)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ 
                width: `${getProgressPercentage(progress.knownByDifficulty.intermediate, progress.totalByDifficulty.intermediate)}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {progress.knownByDifficulty.intermediate} / {progress.totalByDifficulty.intermediate}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('learningPath.ADVANCED')}</span>
            <span className="text-xs font-bold text-red-600">
              {getProgressPercentage(progress.knownByDifficulty.advanced, progress.totalByDifficulty.advanced)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ 
                width: `${getProgressPercentage(progress.knownByDifficulty.advanced, progress.totalByDifficulty.advanced)}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {progress.knownByDifficulty.advanced} / {progress.totalByDifficulty.advanced}
          </div>
        </div>
      </div>

      {nextChordsToLearn.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('learningPath.NEXT_CHORDS_TITLE')}</h3>
          <div className="flex flex-wrap gap-2">
            {nextChordsToLearn.map((chord) => (
              <span
                key={chord.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {chord.name}
                {chord.difficulty && (
                  <span className="ml-2 text-xs opacity-75">
                    ({difficultyLabel(chord.difficulty)})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
