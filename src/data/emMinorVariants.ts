import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function emVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Em — ${name}` };
}

const emMinorVariants = [
  {
    id: 'em-01',
    label: 'Position ouverte (classique)',
    description: 'Mi mineur ouvert : toutes les cordes jouées — La et Ré case 2, Sol et Si à vide.',
    chord: emVariant('ouvert', {
      chord: [[6, 0], [5, 2, 1], [4, 2, 2], [3, 0], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-02',
    label: 'Position ouverte (Mi aigu case 3)',
    description: 'Comme l’ouvert classique, avec le Mi aigu fretté à la 3e case (annulaire).',
    chord: emVariant('ouvert mi aigu case 3', {
      chord: [[6, 0], [5, 2, 1], [4, 2, 2], [3, 0], [2, 0], [1, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-03',
    label: 'Partielle (graves sourds)',
    description: 'Mi grave et La sourds ; Ré case 2 ; Sol, Si et Mi aigu ouverts.',
    chord: emVariant('partielle ouverte', {
      chord: [[6, 'x'], [5, 'x'], [4, 2, 1], [3, 0], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-04',
    label: 'Ouvert (Sol case 4)',
    description: 'Mi grave ouvert ; La et Ré case 2 ; Sol case 4 ; Si ouvert ; Mi aigu case 3.',
    chord: emVariant('ouvert sol case 4', {
      chord: [[6, 0], [5, 2, 1], [4, 2, 2], [3, 4, 4], [2, 0], [1, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-05',
    label: 'Partielle (Mi aigu case 3)',
    description: 'Mi grave et La sourds ; Ré case 2 ; cordes du milieu ouvertes ; Mi aigu case 3.',
    chord: emVariant('partielle mi aigu', {
      chord: [[6, 'x'], [5, 'x'], [4, 2, 1], [3, 0], [2, 0], [1, 3, 2]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-06',
    label: 'Barré (2e case)',
    description: 'Mi grave ouvert ; barré case 2 sur les 5 cordes aiguës ; doigts sur La, Ré et Si.',
    chord: emVariant('barré case 2', {
      chord: [[6, 0], [5, 5, 4], [4, 4, 3], [3, 2], [2, 3, 2], [1, 2]],
      position: 0,
      barres: [{ fromString: 5, toString: 1, fret: 2 }],
    }),
  },
  {
    id: 'em-07',
    label: 'Partielle (La et Mi grave sourds)',
    description: 'Graves sourds ; Ré case 2, Sol case 4, Si ouvert, Mi aigu case 3.',
    chord: emVariant('partielle haute', {
      chord: [[6, 'x'], [5, 'x'], [4, 2, 1], [3, 4, 3], [2, 0], [1, 3, 2]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-08',
    label: 'Position 2e case',
    description: 'Mi grave et La sourds ; doigts en cases 2–5 sur Ré, Sol, Si et Mi aigu.',
    chord: emVariant('case 2', {
      position: 2,
      chord: [[6, 'x'], [5, 'x'], [4, 2, 1], [3, 4, 3], [2, 5, 4], [1, 3, 2]],
      barres: [],
    }),
  },
  {
    id: 'em-09',
    label: 'Forme Am (7e case, Mi grave ouvert)',
    description: 'Mi grave ouvert ; barré case 7 ; doigts sur Si, Ré et Sol (cases 8–9).',
    chord: emVariant('forme Am case 7 ouvert', {
      position: 7,
      chord: [[6, 0], [5, 1, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 1]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'em-10',
    label: 'Forme Am (7e case)',
    description: 'Mi grave sourd ; même forme barrée case 7 sur les 5 cordes aiguës.',
    chord: emVariant('forme Am case 7', {
      position: 7,
      chord: [[6, 'x'], [5, 1, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 1]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'em-11',
    label: 'Variante (9e case)',
    description: 'Mi grave ouvert ; La case 10 ; cordes ouvertes au centre ; petit barré case 12 sur Si et Mi aigu.',
    chord: emVariant('case 9 ouverte', {
      position: 9,
      chord: [[6, 0], [5, 1, 2], [4, 0], [3, 0], [2, 3], [1, 3]],
      barres: [{ fromString: 2, toString: 1, fret: 3 }],
    }),
  },
  {
    id: 'em-12',
    label: 'Forme (9e case, barré partiel)',
    description: 'Mi grave ouvert ; La case 10, Ré case 9 ; barré case 12 sur Sol, Si ; Mi aigu sourd.',
    chord: emVariant('case 9 barré', {
      position: 9,
      chord: [[6, 0], [5, 1, 2], [4, 1, 1], [3, 3], [2, 3], [1, 'x']],
      barres: [{ fromString: 3, toString: 1, fret: 3 }],
    }),
  },
  {
    id: 'em-13',
    label: 'Ouvert (Mi aigu sourd)',
    description: 'Position ouverte sans le Mi aigu — 5 cordes.',
    chord: emVariant('ouvert sans mi aigu', {
      chord: [[6, 0], [5, 2, 1], [4, 2, 2], [3, 0], [2, 0], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-14',
    label: 'Forme Am (7e case, Mi aigu sourd)',
    description: 'Mi grave ouvert ; barré case 7 sans Mi aigu ; doigts sur La, Ré et Sol.',
    chord: emVariant('forme Am case 7 sans mi aigu', {
      position: 7,
      chord: [[6, 0], [5, 1, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'em-15',
    label: 'Forme Am (7e case, graves sourds)',
    description: 'Mi grave et Mi aigu sourds ; doigts en cases 7–9 sur La, Si, Ré et Sol.',
    chord: emVariant('forme Am case 7 réduit', {
      position: 7,
      chord: [[6, 'x'], [5, 1, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'em-16',
    label: 'Position 8e case',
    description: 'Mi grave ouvert ; doigts en cases 8–10 ; Mi aigu sourd.',
    chord: emVariant('case 8', {
      position: 8,
      chord: [[6, 0], [5, 2, 2], [4, 2, 3], [3, 2, 4], [2, 1, 1], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'em-17',
    label: 'Forme (9e case, Mi aigu sourd)',
    description: 'Mi grave ouvert ; barré case 9 ; petit doigt case 12 sur Si ; Mi aigu sourd.',
    chord: emVariant('case 9 sans mi aigu', {
      position: 9,
      chord: [[6, 0], [5, 1, 2], [4, 1, 1], [3, 3], [2, 3, 4], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'em-18',
    label: 'Variante (9e case)',
    description: 'Mi grave ouvert ; La case 10, Ré case 9 ; barré case 12 ; Mi aigu sourd.',
    chord: emVariant('case 9 variante', {
      position: 9,
      chord: [[6, 0], [5, 1, 2], [4, 1, 1], [3, 3], [2, 3], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'em-19',
    label: 'Partielle (Mi grave ouvert)',
    description: 'Mi grave ouvert ; La sourd ; La et Ré case 2 ; Sol et Si ouverts ; Mi aigu sourd.',
    chord: emVariant('partielle mi grave ouvert', {
      chord: [[6, 0], [5, 'x'], [4, 2, 2], [3, 2, 1], [2, 0], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-20',
    label: 'Ouvert (extension case 4–5)',
    description: 'Mi grave ouvert ; La case 2 ; Ré case 4, Sol case 5 ; aigus sourds.',
    chord: emVariant('ouvert extension', {
      chord: [[6, 0], [5, 2, 1], [4, 4, 3], [3, 5, 4], [2, 'x'], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'em-21',
    label: 'Position 4e case',
    description: 'Mi grave ouvert ; doigts en cases 4–7 ; Si et Mi aigu sourds.',
    chord: emVariant('case 4', {
      position: 4,
      chord: [[6, 0], [5, 'x'], [4, 1, 1], [3, 2, 2], [2, 4, 4], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'em-22',
    label: 'Barré (9e case)',
    description: 'Mi grave ouvert ; barré case 9 ; La case 10 ; Si et Mi aigu sourds.',
    chord: emVariant('barré case 9', {
      position: 9,
      chord: [[6, 0], [5, 2, 2], [4, 1], [3, 1], [2, 'x'], [1, 'x']],
      barres: [{ fromString: 4, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'em-23',
    label: 'Forme (9e case, aigus sourds)',
    description: 'Mi grave ouvert ; La case 10, Ré case 9, Sol case 12 ; aigus sourds.',
    chord: emVariant('case 9 aigus sourds', {
      position: 9,
      chord: [[6, 0], [5, 2, 2], [4, 1, 1], [3, 3, 4], [2, 'x'], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'em-24',
    label: 'Power (9e case)',
    description: 'Barré case 9 ; Mi grave case 12, La case 10 ; aigus sourds.',
    chord: emVariant('power case 9', {
      position: 9,
      chord: [[6, 4, 4], [5, 2, 2], [4, 1], [3, 1], [2, 'x'], [1, 'x']],
      barres: [{ fromString: 4, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'em-25',
    label: 'Barré (7e case, partiel)',
    description: 'Mi grave et La sourds ; barré case 7 ; doigts sur Ré et Sol.',
    chord: emVariant('barré case 7 partiel', {
      position: 7,
      chord: [[6, 'x'], [5, 'x'], [4, 1], [3, 2, 2], [2, 3, 3], [1, 1]],
      barres: [{ fromString: 4, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'em-26',
    label: 'Partielle (5 cordes)',
    description: 'Mi grave ouvert ; La sourd ; Ré case 2 ; Sol et Si ouverts ; Mi aigu sourd.',
    chord: emVariant('partielle 5 cordes', {
      chord: [[6, 0], [5, 'x'], [4, 2, 1], [3, 0], [2, 0], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
];

const EM_TOTAL = emMinorVariants.length;

export const emMinorVariantGroup: ChordVariantGroup = {
  id: 'em-minor',
  symbol: 'Em',
  title: 'Mi mineur (Em) — toutes les positions',
  intro:
    `Les ${EM_TOTAL} façons de jouer un Mi mineur. `
    + 'Parcourez chaque diagramme : positions ouvertes, barrés et variantes avec cordes sourdes.',
  variants: emMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${EM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
