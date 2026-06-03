import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function cVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `C — ${name}` };
}

const cMajorVariants = [
  {
    id: 'c-01',
    label: 'Position ouverte (classique)',
    description:
      'Do majeur ouvert : Mi grave sourd ; La case 3, Ré case 2, Sol et Mi aigu à vide ; Si case 1.',
    chord: cVariant('ouvert', {
      chord: [[6, 'x'], [5, 3, 3], [4, 2, 2], [3, 0], [2, 1, 1], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'c-02',
    label: 'Position ouverte (Mi aigu case 3)',
    description: 'Comme l’ouvert classique, avec le Mi aigu fretté à la 3e case (petit doigt).',
    chord: cVariant('ouvert mi aigu case 3', {
      chord: [[6, 'x'], [5, 3, 3], [4, 2, 2], [3, 0], [2, 1, 1], [1, 3, 4]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'c-03',
    label: 'Barré forme A (3e case)',
    description: 'Forme du La majeur en barré à la 3e case — Mi grave et Mi aigu sourds.',
    chord: cVariant('forme A', {
      chord: [[2, 3], [3, 3], [4, 3], [6, 'x']],
      position: 3,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'c-04',
    label: 'Barré forme E (8e case)',
    description: 'Forme du Mi majeur en barré à la 8e case — barré complet sur les 6 cordes.',
    chord: cVariant('forme E', {
      chord: [[3, 2], [4, 3], [5, 3]],
      position: 8,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'c-05',
    label: 'Forme E (8e case, graves sourds)',
    description: 'Mi grave et La sourds ; petit barré sur Si et Mi aigu à la 8e case.',
    chord: cVariant('forme E réduit', {
      position: 8,
      chord: [[6, 'x'], [5, 'x'], [4, 2, 3], [3, 1, 2], [2, 1], [1, 1]],
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'c-06',
    label: 'Position 1 (4 doigts)',
    description: 'Mi grave et La sourds ; quatre doigts sur les cordes du milieu et aiguës.',
    chord: cVariant('case 1 quatre doigts', {
      position: 1,
      chord: [[6, 'x'], [5, 'x'], [4, 1, 1], [3, 3, 2], [2, 4, 4], [1, 3, 3]],
      barres: [],
    }),
  },
  {
    id: 'c-07',
    label: 'Ouvert (Mi aigu sourd)',
    description: 'Mi grave sourd ; La, Ré, Sol ouverts ; Si case 1 — Do sans le Mi aigu.',
    chord: cVariant('ouvert sans mi aigu', {
      chord: [[6, 'x'], [5, 3, 3], [4, 2, 2], [3, 0], [2, 1, 1], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'c-08',
    label: 'Forme A (3e case, barré partiel)',
    description: 'Mi grave et Mi aigu sourds ; index case 3 sur La ; barré sur Ré, Sol et Si.',
    chord: cVariant('forme A barré partiel', {
      position: 3,
      chord: [[6, 'x'], [5, 1, 1], [4, 3], [3, 3], [2, 3], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'c-09',
    label: 'Forme A (5e case)',
    description: 'Mi aigu sourd ; barré à la 5e sur Ré, Sol et Si ; La case 7, Mi grave case 8.',
    chord: cVariant('forme A case 5', {
      position: 5,
      chord: [[6, 3, 4], [5, 2, 3], [4, 1], [3, 1], [2, 1], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'c-10',
    label: 'Forme E (8e case, Mi aigu sourd)',
    description: 'Barré à la 8e comme la forme E, sans jouer le Mi aigu.',
    chord: cVariant('forme E sans mi aigu', {
      position: 8,
      chord: [[6, 1], [5, 3, 3], [4, 3, 4], [3, 2, 2], [2, 1], [1, 'x']],
      barres: [{ fromString: 6, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'c-11',
    label: 'Variante (5e case, cordes sourdes)',
    description: 'Barré case 5 ; Sol et Si sourds ; Mi grave case 8, La case 7.',
    chord: cVariant('case 5 réduit', {
      position: 5,
      chord: [[6, 3, 4], [5, 2, 3], [4, 1], [3, 'x'], [2, 'x'], [1, 1]],
      barres: [{ fromString: 6, toString: 3, fret: 1 }],
    }),
  },
  {
    id: 'c-12',
    label: 'Forme E (8e case, aigus sourds)',
    description: 'Mi grave, La, Ré, Sol frettés ; Si et Mi aigu non joués.',
    chord: cVariant('forme E 4 cordes', {
      position: 8,
      chord: [[6, 1, 1], [5, 3, 3], [4, 3, 4], [3, 2, 2], [2, 'x'], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'c-13',
    label: 'Ouvert (Ré sourd)',
    description: 'Mi grave et Ré sourds ; La case 3, Sol et Mi aigu ouverts, Si case 1.',
    chord: cVariant('ouvert ré sourd', {
      chord: [[6, 'x'], [5, 3, 3], [4, 'x'], [3, 0], [2, 1, 1], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'c-14',
    label: 'Barré (3e case, Mi grave et Ré sourds)',
    description: 'Barré case 3 sur La, Si et Mi aigu ; Sol et Si case 5 ; graves sourds.',
    chord: cVariant('barré case 3', {
      position: 3,
      chord: [[6, 'x'], [5, 1, 1], [4, 'x'], [3, 2, 3], [2, 2, 4]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'c-15',
    label: 'Forme E partielle (8e case)',
    description: 'Mi grave sourd ; barré case 8 sur La, Si et Mi aigu ; Ré et Sol frettés.',
    chord: cVariant('forme E partielle case 8', {
      position: 8,
      chord: [[6, 'x'], [4, 2, 3], [3, 1, 2]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'c-16',
    label: 'Forme A (5e case, aigus sourds)',
    description: 'Mi grave et Mi aigu sourds ; barré case 5 sur Ré, Sol, Si ; La case 8.',
    chord: cVariant('forme A case 5 aigus sourds', {
      position: 5,
      chord: [[6, 'x'], [5, 3, 4], [4, 1], [3, 1], [2, 1], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 1 }],
    }),
  },
  {
    id: 'c-17',
    label: 'Barré (8e case, La et Mi aigu sourds)',
    description: 'Barré case 8 ; La et Mi aigu sourds ; doigts sur Ré et Sol.',
    chord: cVariant('barré case 8 réduit', {
      position: 8,
      chord: [[6, 1], [5, 'x'], [4, 2, 3], [3, 1, 2], [2, 1], [1, 'x']],
      barres: [{ fromString: 6, toString: 2, fret: 1 }],
    }),
  },
];

const C_TOTAL = cMajorVariants.length;

export const cMajorVariantGroup: ChordVariantGroup = {
  id: 'c-major',
  symbol: 'C',
  title: 'Do majeur (C) — toutes les positions',
  intro:
    `Les ${C_TOTAL} façons de jouer un Do majeur. `
    + 'Parcourez chaque diagramme : positions ouvertes, '
    + 'barrés (formes E, A) et variantes avec cordes sourdes.',
  variants: cMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${C_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
