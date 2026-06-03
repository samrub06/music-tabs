import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function dfVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `D/F# — ${name}` };
}

const dFSharpVariants = [
  {
    id: 'df-01',
    label: 'Barré (2e case)',
    description: 'Barré case 2 sur les 6 cordes ; La case 4, Ré case 4, Si case 3, Mi aigu case 5.',
    chord: dfVariant('barré case 2', {
      chord: [[5, 4, 4], [4, 4, 3], [2, 3, 2]],
      position: 2,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'df-16',
    label: 'Barré (2e case, variante)',
    description: 'Même position barrée case 2 — variante avec doigts sur La, Ré, Sol et Mi aigu.',
    chord: dfVariant('barré case 2 variante', {
      chord: [[5, 4, 4], [4, 4, 3], [3, 2, 2], [2, 3, 2], [1, 5, 4]],
      position: 2,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const DF_TOTAL = dFSharpVariants.length;

export const dFSharpVariantGroup: ChordVariantGroup = {
  id: 'd-fsharp',
  symbol: 'D/F#',
  title: 'Ré / Fa# (D/F#) — positions',
  intro: `${DF_TOTAL} positions de D/F# capturées depuis l’app source.`,
  variants: dFSharpVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${DF_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
