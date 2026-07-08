import type { ChordBoxOptions } from 'vexchords';

/** Diagram size for grid / “Accords utilisés” cards (portrait cell, matches reference UI). */
export const CHORD_PREVIEW_DIAGRAM_OPTS: ChordBoxOptions = {
  width: 110,
  height: 134,
  defaultColor: '#444',
  showTuning: true,
};

export const CHORD_PREVIEW_DIAGRAM_WIDTH = CHORD_PREVIEW_DIAGRAM_OPTS.width as number;
export const CHORD_PREVIEW_DIAGRAM_HEIGHT = CHORD_PREVIEW_DIAGRAM_OPTS.height as number;

/** Guitar diagram in chord variant modals */
export const CHORD_MODAL_DIAGRAM_OPTS: ChordBoxOptions = {
  width: 172,
  height: 200,
  defaultColor: '#444',
  showTuning: true,
};

/** Fixed width for horizontal scroll rows (song viewer). Grid layouts use w-full. */
export const CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS = 'w-[10.5rem] shrink-0';

/** Piano SVG frame 1900×800 — wide rectangular cells */
export const CHORD_PREVIEW_PIANO_ASPECT_CLASS = 'aspect-[19/8] min-h-[4.5rem] sm:min-h-[5.5rem]';
export const CHORD_PREVIEW_PIANO_CARD_CLASS = 'w-full max-w-none';
export const CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS = 'w-[18rem] max-w-[85vw] shrink-0';
