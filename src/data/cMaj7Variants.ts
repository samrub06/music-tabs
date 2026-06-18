import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function cMaj7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Cmaj7 — ${name}` };
}

/** Ordre carousel source : 1 (sur 26 dans l’app). */
const cMaj7Variants = [
  {
    id: 'cmaj7-01',
    label: 'Position ouverte (classique)',
    description: 'Do majeur 7 ouvert : Mi grave sourd ; La case 3, Ré case 2 ; Sol, Si et Mi aigu ouverts.',
    chord: cMaj7Variant('ouvert', {
      chord: [[6, 'x'], [5, 3, 2], [4, 2, 1], [3, 0], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
];

const CMAJ7_TOTAL = cMaj7Variants.length;

export const cMaj7VariantGroup: ChordVariantGroup = {
  id: 'cmaj7',
  symbol: 'Cmaj7',
  title: 'Do majeur 7 (Cmaj7) — positions',
  intro:
    `${CMAJ7_TOTAL} première position de Do majeur 7 (n° 1 sur 26 dans l’app source). `
    + 'Forme ouverte avec Mi grave sourd.',
  variants: cMaj7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${CMAJ7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
