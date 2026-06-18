import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function eMaj7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Emaj7 — ${name}` };
}

/** Ordre carousel source : 1 (sur 51 dans l’app). */
const eMaj7Variants = [
  {
    id: 'emaj7-01',
    label: 'Position ouverte (classique)',
    description: 'Mi majeur 7 ouvert : Mi grave, Si et Mi aigu ouverts ; Ré case 1, La case 2, Sol case 1.',
    chord: eMaj7Variant('ouvert', {
      chord: [[6, 0], [5, 2, 3], [4, 1, 1], [3, 1, 2], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
];

const EMAJ7_TOTAL = eMaj7Variants.length;

export const eMaj7VariantGroup: ChordVariantGroup = {
  id: 'emaj7',
  symbol: 'Emaj7',
  title: 'Mi majeur 7 (Emaj7) — positions',
  intro:
    `${EMAJ7_TOTAL} première position de Mi majeur 7 (n° 1 sur 51 dans l’app source). `
    + 'Forme ouverte classique.',
  variants: eMaj7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${EMAJ7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
