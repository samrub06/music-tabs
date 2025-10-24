import { useState } from 'react';

export function useChordDiagram() {
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordDiagram, setShowChordDiagram] = useState(false);

  const handleChordClick = (chord: string) => {
    setSelectedChord(chord);
    setShowChordDiagram(true);
  };

  const handleCloseChordDiagram = () => {
    setShowChordDiagram(false);
  };

  return {
    selectedChord,
    showChordDiagram,
    handleChordClick,
    handleCloseChordDiagram
  };
}
