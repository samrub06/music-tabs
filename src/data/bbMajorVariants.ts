import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function bbVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Bb — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 16 dans l’app). */
const bbMajorVariants = [
  {
    id: 'bb-01',
    label: 'Barré forme A (1re case)',
    description: 'Mi grave sourd ; barré case 1 ; doigts sur Ré, Sol et Si (case 3).',
    chord: bbVariant('forme A case 1', {
      chord: [[6, 'x'], [5, 1], [4, 3, 2], [3, 3, 3], [2, 3, 4], [1, 1]],
      position: 1,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'bb-02',
    label: 'Barré forme E (6e case)',
    description: 'Barré complet case 6 ; doigts sur Sol, Ré et La (cases 7–8).',
    chord: bbVariant('forme E case 6', {
      chord: [[3, 2, 2], [4, 3, 4], [5, 3, 3]],
      position: 6,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const BB_TOTAL = bbMajorVariants.length;

export const bbMajorVariantGroup: ChordVariantGroup = {
  id: 'bb-major',
  symbol: 'Bb',
  title: 'Si bémol majeur (Bb) — positions',
  intro:
    `${BB_TOTAL} premières positions de Si bémol (n° 1 et 2 sur 16 dans l’app source). `
    + 'Formes barrées A et E.',
  variants: bbMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${BB_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
