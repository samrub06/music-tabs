'use client';

import type { Chord } from '@/types';
import type { UserChordProgress } from '@/lib/services/userChordAnalysis';

interface LearningPathProps {
  chords: Chord[];
  progress: UserChordProgress;
  knownChordIds: Set<string>;
}

export default function LearningPath({ chords, progress, knownChordIds }: LearningPathProps) {
  const isChordKnown = (chord: Chord): boolean => {
    return knownChordIds.has(chord.id);
  };

  // Get next chords to learn (ordered by learning_order)
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
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Votre Progression d'Apprentissage</h2>
      
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression Globale</span>
          <span className="text-sm font-bold text-blue-600">{progress.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {progress.totalKnown} accords connus sur {progress.totalChords} au total
        </div>
      </div>

      {/* Progress by Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Beginner */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Débutant</span>
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

        {/* Intermediate */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Intermédiaire</span>
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

        {/* Advanced */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Avancé</span>
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

      {/* Next Chords to Learn */}
      {nextChordsToLearn.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Prochains Accords à Apprendre</h3>
          <div className="flex flex-wrap gap-2">
            {nextChordsToLearn.map((chord) => (
              <span
                key={chord.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {chord.name}
                {chord.difficulty && (
                  <span className="ml-2 text-xs opacity-75">
                    ({chord.difficulty === 'beginner' ? 'Débutant' : chord.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'})
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

