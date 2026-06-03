import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function bdimVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Bdim — ${name}` };
}

const bDimVariants = [
  {
    id: 'bdim-01',
    label: 'Position ouverte',
    description: 'Si diminué : Mi grave sourd ; Ré ouvert ; La case 2, Sol case 3, Si ouvert, Mi aigu case 1.',
    chord: bdimVariant('ouvert', {
      chord: [[6, 'x'], [5, 2, 2], [4, 0], [3, 3, 4], [2, 0], [1, 1, 1]],
      position: 0,
      barres: [],
    }),
  },
];

const BDIM_TOTAL = bDimVariants.length;

export const bDimVariantGroup: ChordVariantGroup = {
  id: 'bdim',
  symbol: 'Bdim',
  title: 'Si diminué (Bdim)',
  intro: `Position ouverte de Si diminué.`,
  variants: bDimVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${BDIM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
