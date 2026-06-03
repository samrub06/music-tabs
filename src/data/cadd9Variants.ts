import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function cadd9Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Cadd9 — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 10 dans l’app). */
const cadd9Variants = [
  {
    id: 'cadd9-01',
    label: 'Position ouverte (Mi aigu ouvert)',
    description: 'Mi grave sourd ; La case 3, Ré case 2, Sol ouvert, Si case 3, Mi aigu ouvert.',
    chord: cadd9Variant('ouvert', {
      chord: [[6, 'x'], [5, 3, 2], [4, 2, 1], [3, 0], [2, 3, 3], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'cadd9-02',
    label: 'Position ouverte (Mi aigu case 3)',
    description: 'Comme l’ouvert, avec le Mi aigu fretté à la 3e case (annulaire).',
    chord: cadd9Variant('ouvert mi aigu case 3', {
      chord: [[6, 'x'], [5, 3, 2], [4, 2, 1], [3, 0], [2, 3, 3], [1, 3, 4]],
      position: 0,
      barres: [],
    }),
  },
];

const CADD9_TOTAL = cadd9Variants.length;

export const cadd9VariantGroup: ChordVariantGroup = {
  id: 'cadd9',
  symbol: 'Cadd9',
  title: 'Do add9 (Cadd9) — positions',
  intro:
    `${CADD9_TOTAL} premières positions de Cadd9 (n° 1 et 2 sur 10 dans l’app source).`,
  variants: cadd9Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${CADD9_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
