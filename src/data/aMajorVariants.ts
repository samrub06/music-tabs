import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function aVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `A — ${name}` };
}

/** Ordre carousel source : 1 → 4 (sur 23 dans l’app). */
const aMajorVariants = [
  {
    id: 'a-01',
    label: 'Position ouverte (classique)',
    description: 'La majeur ouvert : Mi grave sourd ; La et Mi aigu ouverts ; Ré, Sol et Si case 2.',
    chord: aVariant('ouvert', {
      chord: [[6, 'x'], [5, 0], [4, 2, 1], [3, 2, 2], [2, 2, 3], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'a-02',
    label: 'Barré partiel (2e case)',
    description: 'Mi grave sourd ; La ouvert ; barré case 2 sur Ré, Sol et Si ; Mi aigu case 5 (petit doigt).',
    chord: aVariant('barré partiel case 2', {
      chord: [[6, 'x'], [5, 0], [4, 2], [3, 2], [2, 2], [1, 5, 4]],
      position: 0,
      barres: [{ fromString: 4, toString: 2, fret: 2 }],
    }),
  },
  {
    id: 'a-03',
    label: 'Forme barrée (5e case, La ouvert)',
    description: 'Mi grave sourd ; La ouvert ; petit barré case 5 sur Si et Mi aigu ; Sol case 6, Ré case 7.',
    chord: aVariant('forme case 5 la ouvert', {
      chord: [[6, 'x'], [5, 0], [4, 3, 3], [3, 2, 2], [2, 1], [1, 1]],
      position: 5,
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'a-04',
    label: 'Barré forme E (5e case)',
    description: 'Barré complet case 5 ; doigts sur Sol case 6, Ré et La case 7.',
    chord: aVariant('forme E case 5', {
      chord: [[3, 2, 2], [4, 3, 4], [5, 3, 3]],
      position: 5,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const A_TOTAL = aMajorVariants.length;

export const aMajorVariantGroup: ChordVariantGroup = {
  id: 'a-major',
  symbol: 'A',
  title: 'La majeur (A) — positions',
  intro:
    `${A_TOTAL} premières positions de La majeur (n° 1 à 4 sur 23 dans l’app source). `
    + 'Ouvert, barré partiel case 2, forme barrée et forme E à la 5e case.',
  variants: aMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${A_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
