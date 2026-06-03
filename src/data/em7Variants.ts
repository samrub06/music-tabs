import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function em7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Em7 — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 49 dans l’app). */
const em7Variants = [
  {
    id: 'em7-01',
    label: 'Position ouverte (classique)',
    description: 'Mi mineur 7 ouvert : La case 2 ; Ré, Sol, Si et Mi aigu ouverts.',
    chord: em7Variant('ouvert', {
      chord: [[6, 0], [5, 2, 1], [4, 0], [3, 0], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em7-02',
    label: 'Position ouverte (Mi aigu case 3)',
    description: 'Comme l’ouvert, avec le Mi aigu fretté à la 3e case (majeur).',
    chord: em7Variant('ouvert mi aigu case 3', {
      chord: [[6, 0], [5, 2, 1], [4, 0], [3, 0], [2, 0], [1, 3, 2]],
      position: 0,
      barres: [],
    }),
  },
];

const EM7_TOTAL = em7Variants.length;

export const em7VariantGroup: ChordVariantGroup = {
  id: 'em7',
  symbol: 'Em7',
  title: 'Mi mineur 7 (Em7) — positions',
  intro:
    `${EM7_TOTAL} premières positions d’Em7 (n° 1 et 2 sur 49 dans l’app source).`,
  variants: em7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${EM7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
