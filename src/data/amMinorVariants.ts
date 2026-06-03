import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function amVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Am — ${name}` };
}

/** Positions capturées depuis les captures (5 / 22 dans l’app source). */
const amMinorVariants = [
  {
    id: 'am-01',
    label: 'Position ouverte (classique)',
    description: 'La mineur ouvert : Mi grave sourd ; La ouvert ; Ré et Sol case 2, Si case 1, Mi aigu ouvert.',
    chord: amVariant('ouvert', {
      chord: [[6, 'x'], [5, 0], [4, 2, 2], [3, 2, 3], [2, 1, 1], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'am-02',
    label: 'Barré partiel (5e case)',
    description: 'Mi grave sourd ; La ouvert ; Ré case 2 ; barré case 5 sur Sol, Si et Mi aigu.',
    chord: amVariant('barré partiel case 5', {
      chord: [[6, 'x'], [5, 0], [4, 2, 1], [3, 5], [2, 5], [1, 5]],
      position: 0,
      barres: [{ fromString: 3, toString: 1, fret: 5 }],
    }),
  },
  {
    id: 'am-03',
    label: 'Forme barrée (5e case)',
    description: 'Mi grave sourd ; La ouvert ; barré case 5 ; Ré case 7.',
    chord: amVariant('forme case 5', {
      chord: [[6, 'x'], [5, 0], [4, 3, 3], [3, 1], [2, 1], [1, 1]],
      position: 5,
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'am-04',
    label: 'Forme barrée (5e case, Mi aigu case 8)',
    description: 'Comme la forme case 5, avec le Mi aigu à la 8e case (petit doigt).',
    chord: amVariant('forme case 5 mi aigu', {
      chord: [[6, 'x'], [5, 0], [4, 3, 3], [3, 1], [2, 1], [1, 4, 4]],
      position: 5,
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'am-05',
    label: 'Barré complet (5e case)',
    description: 'Barré case 5 sur les 6 cordes ; La et Ré case 7.',
    chord: amVariant('barré complet case 5', {
      chord: [[5, 3, 3], [4, 3, 4]],
      position: 5,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const AM_TOTAL = amMinorVariants.length;

export const amMinorVariantGroup: ChordVariantGroup = {
  id: 'am-minor',
  symbol: 'Am',
  title: 'La mineur (Am) — positions',
  intro:
    `${AM_TOTAL} positions de La mineur (extrait des variantes de l’app source). `
    + 'Ouvert, barrés partiels et forme complète à la 5e case.',
  variants: amMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${AM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
