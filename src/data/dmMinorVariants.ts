import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function dmVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `Dm — ${name}` };
}

/** Ordre carousel source : 1 → 4 (sur 17 dans l’app). */
const dmMinorVariants = [
  {
    id: 'dm-01',
    label: 'Position ouverte (classique)',
    description: 'Ré mineur ouvert : Mi grave et La sourds ; Ré ouvert ; Sol case 2, Si case 3, Mi aigu case 1.',
    chord: dmVariant('ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2, 2], [2, 3, 3], [1, 1, 1]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'dm-02',
    label: 'Position 5e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; Mi aigu case 5, Si case 6, Sol case 7.',
    chord: dmVariant('case 5 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 3, 3], [2, 2, 2], [1, 1, 1]],
      position: 5,
      barres: [],
    }),
  },
  {
    id: 'dm-03',
    label: 'Barré forme E (5e case)',
    description: 'Mi grave sourd ; barré case 5 ; doigts sur Sol case 6, Ré et La case 7.',
    chord: dmVariant('forme E case 5', {
      chord: [[6, 'x'], [5, 1], [4, 3, 3], [3, 3, 4], [2, 2, 2], [1, 1]],
      position: 5,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'dm-04',
    label: 'Position 10e case (Ré ouvert)',
    description: 'Graves sourds ; Ré ouvert ; petit barré case 10 sur Sol, Si et Mi aigu.',
    chord: dmVariant('case 10 ré ouvert', {
      chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 1], [2, 1], [1, 1]],
      position: 10,
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
];

const DM_TOTAL = dmMinorVariants.length;

export const dmMinorVariantGroup: ChordVariantGroup = {
  id: 'dm-minor',
  symbol: 'Dm',
  title: 'Ré mineur (Dm) — positions',
  intro:
    `${DM_TOTAL} premières positions de Ré mineur (n° 1 à 4 sur 17 dans l’app source). `
    + 'Ouvert, forme case 5 avec Ré ouvert, barré forme E et variante case 10.',
  variants: dmMinorVariants.map((v, i) => ({
    ...v,
    label: `${i + 1} / ${DM_TOTAL} — ${v.label}`,
  })),
  showCarousel: true,
};
