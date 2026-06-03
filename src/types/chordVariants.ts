export type VexChordFingering =
  | [number, number | 'x' | 0]
  | [number, number | 'x' | 0, string | number];

export interface VexChordDiagramData {
  name: string;
  chord: VexChordFingering[];
  position: number;
  barres: Array<{ fromString: number; toString: number; fret: number }>;
  positionText?: number;
}

export interface ChordVariant {
  id: string;
  label: string;
  description: string;
  chord: VexChordDiagramData;
}

export interface ChordVariantGroup {
  id: string;
  /** Short label on grid card and diagram (e.g. G, C) */
  symbol: string;
  title: string;
  intro: string;
  variants: ChordVariant[];
  showCarousel?: boolean;
}
