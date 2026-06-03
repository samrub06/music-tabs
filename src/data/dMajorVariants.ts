import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function dVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `D — ${name}` };
}

const dMajorVariants = [
  {
    id: 'd-01',
    label: 'Position ouverte (classique)',
    description: 'Ré majeur ouvert : Mi grave et La sourds ; Ré ouvert ; Sol case 2, Si case 3, Mi aigu case 2.',
    chord: dVariant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2, 1], [2, 3, 3], [1, 2, 2]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'd-02',
    label: 'Position 2e case (La ouvert)',
    description: 'Mi grave sourd ; La ouvert ; doigts en cases 2–5 sur Ré, Sol, Si et Mi aigu.',
    chord: dVariant('case 2 la ouvert', {
      chord: [[6, 'x'], [5, 0], [4, 5, 4], [3, 4, 3], [2, 3, 2], [1, 2]],
      position: 2,
      barres: [{ fromString: 1, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-03',
    label: 'Position 5e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; Mi aigu case 5 ; Sol et Si case 7.',
    chord: dVariant('case 5 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [1, 5, 1], [3, 7, 3], [2, 7, 4]],
      position: 5,
      barres: [],
    }),
  },
  {
    id: 'd-04',
    label: 'Barré forme A (5e case)',
    description: 'Mi grave sourd ; barré case 5 ; doigts sur Ré, Sol et Si à la 7e case.',
    chord: dVariant('forme A case 5', {
      chord: [[6, 'x'], [5, 1], [4, 3, 2], [3, 3, 3], [2, 3, 4], [1, 1]],
      position: 5,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-05',
    label: 'Position 10e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; petit barré case 10 sur Si et Mi aigu ; Sol case 11.',
    chord: dVariant('case 10 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 1, 2], [2, 1], [1, 1]],
      position: 10,
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-06',
    label: 'Barré forme E (10e case)',
    description: 'Barré complet case 10 ; doigts sur Sol, Ré et La (cases 11–12).',
    chord: dVariant('forme E case 10', {
      chord: [[3, 2, 2], [4, 3, 3], [5, 3, 4]],
      position: 10,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-07',
    label: 'Position 10e case (partielle)',
    description: 'Graves sourds ; petit barré case 10 ; Sol case 11, Ré case 12.',
    chord: dVariant('case 10 partielle', {
      chord: [[6, 'x'], [5, 'x'], [4, 3, 3], [3, 2, 2], [2, 1], [1, 1]],
      position: 10,
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-08',
    label: 'Position 2e case (4 doigts)',
    description: 'Mi grave et Mi aigu sourds ; quatre doigts sur La, Ré, Sol et Si.',
    chord: dVariant('case 2 quatre doigts', {
      chord: [[6, 'x'], [5, 5, 4], [4, 4, 3], [3, 2, 1], [2, 3, 2], [1, 'x']],
      position: 2,
      barres: [],
    }),
  },
  {
    id: 'd-09',
    label: 'Forme A (5e case, Mi aigu sourd)',
    description: 'Mi grave sourd ; La case 5 ; barré case 7 sur Ré, Sol et Si ; Mi aigu sourd.',
    chord: dVariant('forme A case 5 sans mi aigu', {
      chord: [[6, 'x'], [5, 1, 1], [4, 3], [3, 3], [2, 3], [1, 'x']],
      position: 5,
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'd-10',
    label: 'Position 7e case',
    description: 'Barré case 7 sur Ré, Sol et Si ; La case 9, Mi grave case 10 ; Mi aigu sourd.',
    chord: dVariant('case 7', {
      chord: [[6, 4, 4], [5, 3, 3], [4, 1], [3, 1], [2, 1], [1, 'x']],
      position: 7,
      barres: [{ fromString: 4, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'd-11',
    label: 'Barré forme E (10e case, Mi aigu sourd)',
    description: 'Barré case 10 sur 5 cordes ; doigts sur Sol, Ré et La ; Mi aigu sourd.',
    chord: dVariant('forme E case 10 sans mi aigu', {
      chord: [[6, 1], [5, 3, 3], [4, 3, 4], [3, 2, 2], [2, 1], [1, 'x']],
      position: 10,
      barres: [{ fromString: 6, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'd-12',
    label: 'Position 7e case (aiguës sourdes)',
    description: 'Barré case 7 ; La et Mi grave frettés ; Si et Mi aigu sourds.',
    chord: dVariant('case 7 réduit', {
      chord: [[6, 4, 4], [5, 3, 3], [4, 1], [3, 1], [2, 'x'], [1, 'x']],
      position: 7,
      barres: [{ fromString: 4, toString: 3, fret: 1 }],
    }),
  },
  {
    id: 'd-13',
    label: 'Position 10e case (aiguës sourdes)',
    description: 'Mi grave case 10 ; La et Ré cases 12 ; Sol case 11 ; Si et Mi aigu sourds.',
    chord: dVariant('case 10 sans aiguës', {
      chord: [[6, 1, 1], [5, 3, 3], [4, 3, 4], [3, 2, 2], [2, 'x'], [1, 'x']],
      position: 10,
      barres: [],
    }),
  },
  {
    id: 'd-14',
    label: 'Barré (2e case, Ré sourd)',
    description: 'Mi grave et Ré sourds ; barré case 2 sur Sol, Si et Mi aigu ; La case 4, Si case 3.',
    chord: dVariant('barré case 2 réduit', {
      chord: [[6, 'x'], [5, 3, 4], [4, 'x'], [3, 1], [2, 2, 2], [1, 1]],
      position: 2,
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-15',
    label: 'Forme A (5e case, graves sourds)',
    description: 'Mi grave et La sourds ; barré case 5 ; Sol et Si case 7.',
    chord: dVariant('forme A case 5 graves sourds', {
      chord: [[6, 'x'], [5, 'x'], [4, 1], [3, 3, 3], [2, 3, 4], [1, 1]],
      position: 5,
      barres: [{ fromString: 4, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-16',
    label: 'Barré (10e case, La sourd)',
    description: 'Barré case 10 ; La sourd ; Sol case 11, Ré case 12.',
    chord: dVariant('barré case 10 la sourd', {
      chord: [[6, 1], [5, 'x'], [4, 3, 3], [3, 2, 2], [2, 1], [1, 1]],
      position: 10,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'd-17',
    label: 'Position 7e case (La et Mi aigu sourds)',
    description: 'La et Mi aigu sourds ; barré case 7 ; Mi grave case 10.',
    chord: dVariant('case 7 la et mi aigu sourds', {
      chord: [[6, 4, 4], [5, 'x'], [4, 1], [3, 1], [2, 1], [1, 'x']],
      position: 7,
      barres: [{ fromString: 4, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'd-18',
    label: 'Barré (10e case, La et Mi aigu sourds)',
    description: 'Barré case 10 ; La et Mi aigu sourds ; Sol case 11, Ré case 12.',
    chord: dVariant('barré case 10 réduit', {
      chord: [[6, 'x'], [5, 3, 3], [4, 2, 2], [3, 1], [2, 'x'], [1, 1]],
      position: 10,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const D_TOTAL = dMajorVariants.length;

export const dMajorVariantGroup: ChordVariantGroup = {
  id: 'd-major',
  symbol: 'D',
  title: 'Ré majeur (D) — toutes les positions',
  intro:
    `Les ${D_TOTAL} façons de jouer un Ré majeur. `
    + 'Positions ouvertes, barrés (formes A et E) et variantes avec cordes sourdes.',
  variants: dMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${D_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
