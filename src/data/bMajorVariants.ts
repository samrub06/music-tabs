import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function bVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `B — ${name}` };
}

/** Positions capturées depuis les captures (2 / 16 dans l’app source). */
const bMajorVariants = [
  {
    id: 'b-01',
    label: 'Barré forme A (2e case)',
    description: 'Mi grave sourd ; barré case 2 ; doigts sur Ré, Sol et Si (cases 4).',
    chord: bVariant('forme A case 2', {
      chord: [[6, 'x'], [5, 1], [4, 3, 2], [3, 3, 3], [2, 3, 4], [1, 1]],
      position: 2,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'b-02',
    label: 'Barré forme E (7e case)',
    description: 'Barré complet case 7 ; doigts sur Sol, Ré et La (cases 8–9).',
    chord: bVariant('forme E case 7', {
      chord: [[3, 2, 2], [4, 3, 4], [5, 3, 3]],
      position: 7,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const B_TOTAL = bMajorVariants.length;

export const bMajorVariantGroup: ChordVariantGroup = {
  id: 'b-major',
  symbol: 'B',
  title: 'Si majeur (B) — positions',
  intro:
    `${B_TOTAL} positions de Si majeur (extrait des variantes de l’app source). `
    + 'Formes barrées A (2e case) et E (7e case).',
  variants: bMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${B_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
