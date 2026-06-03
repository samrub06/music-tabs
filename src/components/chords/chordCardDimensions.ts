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

/** Guitar diagram in chord variant modals */
export const CHORD_MODAL_DIAGRAM_OPTS: ChordBoxOptions = {
  width: 172,
  height: 200,
  defaultColor: '#444',
  showTuning: true,
};

/** Fixed width for horizontal scroll rows (song viewer). Grid layouts use w-full. */
export const CHORD_PREVIEW_CARD_SCROLL_WIDTH_CLASS = 'w-[8rem] shrink-0';
export const CHORD_PREVIEW_PIANO_CARD_SCROLL_WIDTH_CLASS = 'w-[11rem] shrink-0';
