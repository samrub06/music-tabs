import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function cmVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Cm — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 17 dans l’app). */
const cmMinorVariants = [
  {
    id: 'cm-01',
    label: 'Barré forme A (3e case)',
    description: 'Mi grave sourd ; barré case 3 ; Si case 4, Ré et Sol case 5.',
    chord: cmVariant('forme A case 3', {
      chord: [[6, 'x'], [5, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 1]],
      position: 3,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'cm-02',
    label: 'Barré forme E (8e case)',
    description: 'Barré complet case 8 ; La et Ré case 10.',
    chord: cmVariant('forme E case 8', {
      chord: [[5, 3, 3], [4, 3, 4]],
      position: 8,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const CM_TOTAL = cmMinorVariants.length;

export const cmMinorVariantGroup: ChordVariantGroup = {
  id: 'cm-minor',
  symbol: 'Cm',
  title: 'Do mineur (Cm) — positions',
  intro:
    `${CM_TOTAL} premières positions de Do mineur (n° 1 et 2 sur 17 dans l’app source).`,
  variants: cmMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${CM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
