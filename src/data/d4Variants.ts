import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function d4Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `D4 — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 17 dans l’app). */
const d4Variants = [
  {
    id: 'd4-01',
    label: 'Position ouverte',
    description: 'Mi grave et La sourds ; Ré ouvert ; Sol case 2 ; barré case 3 sur Si et Mi aigu.',
    chord: d4Variant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2, 1], [2, 3], [1, 3]],
      position: 0,
      barres: [{ fromString: 2, toString: 1, fret: 3 }],
    }),
  },
  {
    id: 'd4-02',
    label: 'Position 5e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; Mi aigu case 5 ; Sol case 7, Si case 8.',
    chord: d4Variant('case 5 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [1, 1, 1], [3, 3, 3], [2, 4, 4]],
      position: 5,
      barres: [],
    }),
  },
];

const D4_TOTAL = d4Variants.length;

export const d4VariantGroup: ChordVariantGroup = {
  id: 'd4',
  symbol: 'D4',
  title: 'Ré sus4 (D4) — positions',
  intro:
    `${D4_TOTAL} premières positions de D4 (n° 1 et 2 sur 17 dans l’app source).`,
  variants: d4Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${D4_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
