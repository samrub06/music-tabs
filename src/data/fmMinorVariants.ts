import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function fmVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Fm — ${name}` };
}

const fmMinorVariants = [
  {
    id: 'fm-01',
    label: 'Barré (1re case)',
    description: 'Fa mineur barré case 1 ; La case 3, Ré case 3.',
    chord: fmVariant('barré case 1', {
      chord: [[5, 3, 3], [4, 3, 4]],
      position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const FM_TOTAL = fmMinorVariants.length;

export const fmMinorVariantGroup: ChordVariantGroup = {
  id: 'fm-minor',
  symbol: 'Fm',
  title: 'Fa mineur (Fm)',
  intro: `Barré à la 1re case pour le Fa mineur.`,
  variants: fmMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${FM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
