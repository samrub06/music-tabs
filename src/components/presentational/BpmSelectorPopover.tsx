'use client';

import { XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

interface BpmSelectorPopoverProps {
  initialBpm?: number | null;
  onApply: (bpm: number) => void;
  onClose: () => void;
}

export default function BpmSelectorPopover({
  initialBpm,
  onApply,
  onClose
}: BpmSelectorPopoverProps) {
  const [bpm, setBpm] = useState<number>(initialBpm || 100);

  // Sync local state with initialBpm when it changes
  useEffect(() => {
    if (initialBpm !== null && initialBpm !== undefined) {
      setBpm(initialBpm);
    }
  }, [initialBpm]);

  const handleIncrement = () => {
    setBpm(prev => Math.min(300, prev + 5));
  };

  const handleDecrement = () => {
    setBpm(prev => Math.max(30, prev - 5));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setBpm(val);
    }
  };

  const handleApply = () => {
    // Validate final value
    let finalBpm = bpm;
    if (finalBpm < 30) finalBpm = 30;
    if (finalBpm > 300) finalBpm = 300;
    
    onApply(finalBpm);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleDecrement}
        className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        disabled={bpm <= 30}
      >
        <MinusIcon className="h-3 w-3" />
      </button>

      <input
        type="number"
        value={bpm}
        onChange={handleInputChange}
        min="30"
        max="300"
        className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      <button
        onClick={handleIncrement}
        className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        disabled={bpm >= 300}
      >
        <PlusIcon className="h-3 w-3" />
      </button>

      <button
        onClick={handleApply}
        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
      >
        OK
      </button>

      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </div>
  );
}
