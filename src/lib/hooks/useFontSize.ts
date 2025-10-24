import { useState } from 'react';

export function useFontSize(initialSize: number = 14) {
  const [fontSize, setFontSize] = useState(initialSize);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)); // Max 24px
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 10)); // Min 10px
  };

  const resetFontSize = () => {
    setFontSize(initialSize);
  };

  return {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  };
}
