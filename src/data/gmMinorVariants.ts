import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function gmVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Gm — ${name}` };
}

/** Position n° 1 sur 17 dans l’app source. */
const gmMinorVariants = [
  {
    id: 'gm-01',
    label: 'Barré forme E (3e case)',
    description: 'Barré complet case 3 ; La et Ré case 5.',
    chord: gmVariant('forme E case 3', {
      chord: [[5, 3, 3], [4, 3, 4]],
      position: 3,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const GM_TOTAL = gmMinorVariants.length;

export const gmMinorVariantGroup: ChordVariantGroup = {
  id: 'gm-minor',
  symbol: 'Gm',
  title: 'Sol mineur (Gm) — positions',
  intro: `Position n° 1 sur 17 dans l’app source (barré forme E à la 3e case).`,
  variants: gmMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${GM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
