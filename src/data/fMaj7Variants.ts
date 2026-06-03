import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function f7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Fmaj7 — ${name}` };
}

const fMaj7Variants = [
  {
    id: 'fmaj7-01',
    label: 'Position ouverte',
    description: 'Fa majeur 7 ouvert : graves sourds ; Ré case 3, Sol case 2, Si case 1, Mi aigu ouvert.',
    chord: f7Variant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 3, 3], [3, 2, 2], [2, 1, 1], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
];

const FMAJ7_TOTAL = fMaj7Variants.length;

export const fMaj7VariantGroup: ChordVariantGroup = {
  id: 'fmaj7',
  symbol: 'Fmaj7',
  title: 'Fa majeur 7 (Fmaj7)',
  intro: `Position ouverte de Fa majeur 7.`,
  variants: fMaj7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${FMAJ7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
