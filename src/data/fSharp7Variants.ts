import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function fSharp7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `F#7 — ${name}` };
}

/** Ordre carousel source : 1 (sur 27 dans l’app). */
const fSharp7Variants = [
  {
    id: 'fsharp7-01',
    label: 'Position ouverte (classique)',
    description: 'Fa# 7 ouvert : Mi grave et La sourds ; Ré case 4, Sol case 3, Si case 2, Mi aigu ouvert.',
    chord: fSharp7Variant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 4, 3], [3, 3, 2], [2, 2, 1], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
];

const FSHARP7_TOTAL = fSharp7Variants.length;

export const fSharp7VariantGroup: ChordVariantGroup = {
  id: 'fsharp7',
  symbol: 'F#7',
  title: 'Fa dièse 7 (F#7) — positions',
  intro:
    `${FSHARP7_TOTAL} première position de Fa# 7 (n° 1 sur 27 dans l’app source). `
    + 'Forme ouverte avec graves sourds.',
  variants: fSharp7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${FSHARP7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
