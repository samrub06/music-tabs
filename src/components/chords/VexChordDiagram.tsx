'use client';

import { useLayoutEffect, useRef } from 'react';
import { ChordBox } from 'vexchords';
import type { ChordBoxOptions } from 'vexchords';
import type { VexChordDiagramData } from '@/types/chordVariants';

const DEFAULT_OPTS: ChordBoxOptions = {
  width: 130,
  height: 150,
  defaultColor: '#444',
};

interface VexChordDiagramProps {
  chord: VexChordDiagramData;
  options?: ChordBoxOptions;
}

export function VexChordDiagram({ chord, options = DEFAULT_OPTS }: VexChordDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = options.width ?? DEFAULT_OPTS.width ?? 130;
  const height = options.height ?? DEFAULT_OPTS.height ?? 150;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const { name: _chordName, ...diagram } = chord;
    el.innerHTML = '';
    const box = new ChordBox(el, options);
    box.draw(diagram);

    return () => {
      el.innerHTML = '';
    };
  }, [chord, options]);

  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ width, height }}
      ref={containerRef}
    />
  );
}
