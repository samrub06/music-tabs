import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function eVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `E — ${name}` };
}

/** Ordre carousel source : 1 → 4 (sur 29 dans l’app). */
const eMajorVariants = [
  {
    id: 'e-01',
    label: 'Position ouverte (classique)',
    description: 'Mi majeur ouvert : Mi grave, Si et Mi aigu ouverts ; La et Ré case 2, Sol case 1.',
    chord: eVariant('ouvert', {
      chord: [[6, 0], [5, 2, 2], [4, 2, 3], [3, 1, 1], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'e-02',
    label: 'Partielle (graves sourds)',
    description: 'Mi grave et La sourds ; Ré case 2, Sol case 1 ; Si et Mi aigu ouverts.',
    chord: eVariant('partielle graves sourds', {
      chord: [[6, 'x'], [5, 'x'], [4, 2, 2], [3, 1, 1], [2, 0], [1, 0]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'e-03',
    label: 'Barré partiel (2e case, Mi grave ouvert)',
    description: 'Mi grave ouvert ; barré case 2 sur La, Ré, Sol, Si et Mi aigu ; doigts aux cases 4–5.',
    chord: eVariant('barré partiel case 2', {
      chord: [[6, 0], [5, 2], [4, 2], [3, 4, 2], [2, 5, 4], [1, 4, 3]],
      position: 0,
      barres: [{ fromString: 5, toString: 1, fret: 2 }],
    }),
  },
  {
    id: 'e-04',
    label: 'Partielle (Mi aigu case 4)',
    description: 'Mi grave et La sourds ; Ré case 2, Sol case 1, Si ouvert ; Mi aigu case 4 (petit doigt).',
    chord: eVariant('partielle mi aigu case 4', {
      chord: [[6, 'x'], [5, 'x'], [4, 2, 2], [3, 1, 1], [2, 0], [1, 4, 4]],
      position: 0,
      barres: [],
    }),
  },
];

const E_TOTAL = eMajorVariants.length;

export const eMajorVariantGroup: ChordVariantGroup = {
  id: 'e-major',
  symbol: 'E',
  title: 'Mi majeur (E) — positions',
  intro:
    `${E_TOTAL} premières positions de Mi majeur (n° 1 à 4 sur 29 dans l’app source). `
    + 'Ouvert, partielles avec graves sourds, barré case 2 et variante Mi aigu case 4.',
  variants: eMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${E_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
