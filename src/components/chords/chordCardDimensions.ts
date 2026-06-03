import type { ChordBoxOptions } from 'vexchords';

/** Diagram size for grid / “Accords utilisés” cards (portrait cell, matches reference UI). */
export const CHORD_PREVIEW_DIAGRAM_OPTS: ChordBoxOptions = {
  width: 88,
  height: 108,
  defaultColor: '#444',
  showTuning: true,
};

export const CHORD_PREVIEW_DIAGRAM_WIDTH = CHORD_PREVIEW_DIAGRAM_OPTS.width as number;
export const CHORD_PREVIEW_DIAGRAM_HEIGHT = CHORD_PREVIEW_DIAGRAM_OPTS.height as number;

/** Tailwind width class aligned with diagram width + card padding */
export const CHORD_PREVIEW_CARD_WIDTH_CLASS = 'w-[5.75rem]';
