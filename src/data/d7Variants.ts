import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function d7Variant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `D7 — ${name}` };
}

const d7Variants = [
  {
    id: 'd7-01',
    label: 'Position ouverte (classique)',
    description: 'Ré 7 ouvert : Mi grave et La sourds ; Ré ouvert ; Sol case 2, Si case 1, Mi aigu case 2.',
    chord: d7Variant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2, 2], [2, 1, 1], [1, 2, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'd7-02',
    label: 'Position ouverte (Mi aigu auriculaire)',
    description: 'Même grille que l’ouvert classique, avec le Mi aigu fretté à l’auriculaire.',
    chord: d7Variant('ouvert auriculaire', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2, 2], [2, 1, 1], [1, 2, 4]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'd7-03',
    label: 'Position 5e case (Ré ouvert, petit barré)',
    description: 'Graves sourds ; Ré ouvert ; petit barré case 5 sur Sol, Si et Mi aigu ; Si case 7.',
    chord: d7Variant('case 5 ré ouvert barré', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 1], [2, 3, 3], [1, 1]],
      position: 5,
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd7-04',
    label: 'Position 5e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; Sol case 5, Si case 7, Mi aigu case 8.',
    chord: d7Variant('case 5 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 1, 1], [2, 3, 3], [1, 4, 4]],
      position: 5,
      barres: [],
    }),
  },
  {
    id: 'd7-05',
    label: 'Barré forme A (5e case)',
    description: 'Mi grave sourd ; barré case 5 ; Ré case 7, Si case 7.',
    chord: d7Variant('forme A case 5', {
      chord: [[6, 'x'], [5, 1], [4, 3, 3], [3, 1], [2, 4, 4], [1, 1]],
      position: 5,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd7-06',
    label: 'Forme A (5e case, barré case 7)',
    description: 'Mi grave sourd ; La case 5 ; barré case 7 sur Ré, Sol et Si ; Mi aigu case 8.',
    chord: d7Variant('forme A case 5 barré haut', {
      chord: [[6, 'x'], [5, 1, 1], [4, 3], [3, 3], [2, 3], [1, 4, 4]],
      position: 5,
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'd7-07',
    label: 'Barré forme A (5e case, 4 doigts)',
    description: 'Mi grave sourd ; barré case 5 ; Ré, Si et Mi aigu aux cases 7–8.',
    chord: d7Variant('forme A case 5 quatre doigts', {
      chord: [[6, 'x'], [5, 1], [4, 3, 2], [3, 1], [2, 3, 3], [1, 4, 4]],
      position: 5,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
];

const D7_TOTAL = d7Variants.length;

export const d7VariantGroup: ChordVariantGroup = {
  id: 'd7',
  symbol: 'D7',
  title: 'Ré 7 (D7) — toutes les positions',
  intro:
    `Les ${D7_TOTAL} premières façons de jouer un Ré 7. `
    + 'Position ouverte et variantes barrées à la 5e case (forme A).',
  variants: d7Variants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${D7_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
