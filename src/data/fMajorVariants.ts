import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function fVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `F — ${name}` };
}

/** Ordre carousel source : 1 → 2 (sur 16 dans l’app). */
const fMajorVariants = [
  {
    id: 'f-01',
    label: 'Barré forme E (1re case)',
    description: 'Barré complet case 1 ; doigts sur La, Ré et Sol (cases 2–3).',
    chord: fVariant('forme E case 1', {
      chord: [[5, 3, 3], [4, 3, 4], [3, 2, 2]],
      position: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'f-02',
    label: 'Position ouverte (graves sourds)',
    description: 'Mi grave et La sourds ; petit barré case 1 sur Si et Mi aigu ; Ré case 3, Sol case 2.',
    chord: fVariant('ouvert partiel', {
      chord: [[6, 'x'], [5, 'x'], [4, 3, 3], [3, 2, 2], [2, 1], [1, 1]],
      position: 0,
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
];

const F_TOTAL = fMajorVariants.length;

export const fMajorVariantGroup: ChordVariantGroup = {
  id: 'f-major',
  symbol: 'F',
  title: 'Fa majeur (F) — positions',
  intro:
    `${F_TOTAL} premières positions de Fa majeur (n° 1 et 2 sur 16 dans l’app source). `
    + 'Barré forme E et variante ouverte avec graves sourds.',
  variants: fMajorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${F_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
