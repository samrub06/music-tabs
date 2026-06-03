import type { ChordVariantGroup, VexChordDiagramData } from '@/types/chordVariants';

function gVariant(name: string, diagram: Omit<VexChordDiagramData, 'name'>): VexChordDiagramData {
  return { ...diagram, name: `G — ${name}` };
}

const gMajorVariants = [
  {
    id: 'g-01',
    label: 'Position ouverte (3 doigts)',
    description: 'Sol classique : cordes à vide sur Ré, Sol et Si ; case 3 sur Mi grave et Mi aigu.',
    chord: gVariant('ouvert', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 0], [2, 0], [1, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-02',
    label: 'Position ouverte (4 doigts)',
    description: 'Comme la précédente, avec le Si fretté à la 3e case (petit doigt).',
    chord: gVariant('ouvert 4 doigts', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 0], [2, 3, 4], [1, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-03',
    label: 'Position ouverte (variante)',
    description: 'Même grille que la version 4 doigts — toutes les cordes sonnent.',
    chord: gVariant('ouvert variante', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [2, 0], [3, 4, 4], [1, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-04',
    label: 'Barré forme E (3e case)',
    description: 'Forme du Mi majeur en barré à la 3e case — barré complet sur les 6 cordes.',
    chord: gVariant('forme E', {
      chord: [[3, 2], [4, 3], [5, 3]],
      position: 3,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-05',
    label: 'Forme D (3e case)',
    description: 'Mi grave et La sourds ; petit barré sur Si et Mi aigu à la 3e case.',
    chord: gVariant('forme D', {
      position: 3,
      chord: [[6, 'x'], [5, 'x'], [4, 3, 3], [3, 2, 2]],
      barres: [{ fromString: 2, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-06',
    label: 'Forme D (5e case)',
    description: 'Même forme D décalée à la 5e case — son plus médium.',
    chord: gVariant('forme D haute', {
      position: 5,
      chord: [[6, 'x'], [5, 'x'], [4, 1, 1], [3, 3, 2], [2, 4, 4], [1, 3, 3]],
      barres: [],
    }),
  },
  {
    id: 'g-07',
    label: 'Forme C (7e case)',
    description: 'Mi grave sourd ; barré partiel à la 7e sur Sol, Si et Mi aigu.',
    chord: gVariant('forme C', {
      position: 7,
      chord: [[6, 'x'], [5, 4, 4], [4, 3, 3], [2, 2, 2]],
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-08',
    label: 'Barré forme A (10e case)',
    description: 'Forme du La majeur en barré à la 10e case — même Sol, plus aigu.',
    chord: gVariant('forme A', {
      chord: [[2, 3], [3, 3], [4, 3], [6, 'x']],
      position: 10,
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-09',
    label: 'Ouvert (Mi aigu sourd)',
    description: 'Graves et cordes du milieu ; on ne joue pas le Mi aigu (×).',
    chord: gVariant('ouvert sans mi aigu', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 0], [2, 0], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-10',
    label: 'Ouvert (Si sourd)',
    description: 'Le Si n’est pas joué (×) ; les autres cordes comme le Sol ouvert.',
    chord: gVariant('ouvert sans si', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 0], [1, 'x'], [2, 3, 3]],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-11',
    label: 'Ouvert (variante grave)',
    description: 'Mi aigu sourd ; la corde de Sol est frettée à la 4e case.',
    chord: gVariant('ouvert grave', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 4, 3], [2, 0], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-12',
    label: 'Ouvert (Ré à la 4e case)',
    description: 'Corde de Ré frettée case 4 ; Mi aigu sourd — coloration type Sol majeur 7.',
    chord: gVariant('ouvert ré case 4', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 4, 4], [3, 0], [2, 3, 3], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-13',
    label: 'Forme E (3e case, Mi aigu sourd)',
    description: 'Barré à la 3e case comme la forme E, sans jouer le Mi aigu.',
    chord: gVariant('forme E sans mi aigu', {
      position: 3,
      chord: [[1, 'x'], [3, 2, 2], [4, 3, 4], [5, 3, 3]],
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-14',
    label: 'Position 7e case (4 doigts)',
    description: 'Mi grave et Mi aigu sourds ; 4 doigts sur La, Ré, Sol et Si (cases 10-7-9-8).',
    chord: gVariant('case 7 quatre doigts', {
      position: 7,
      chord: [[6, 'x'], [5, 4, 4], [4, 3, 3], [3, 1, 1], [2, 2, 2], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'g-15',
    label: 'Forme A (10e case, partielle)',
    description: 'La à la 10e case ; barré sur Ré, Sol et Si à la 12e ; Mi grave et aigu sourds.',
    chord: gVariant('forme A partielle', {
      position: 10,
      chord: [[6, 'x'], [5, 1, 1], [1, 'x']],
      barres: [{ fromString: 4, toString: 2, fret: 3 }],
    }),
  },
  {
    id: 'g-16',
    label: 'Ouvert (Si et Mi aigu sourds)',
    description: 'Seules les 4 cordes graves/médium sonnent — Sol simple et sec.',
    chord: gVariant('ouvert 4 cordes', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 0], [3, 0], [2, 'x'], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-17',
    label: 'Ouvert (Ré case 4, aigus sourds)',
    description: 'Ré à la 4e case ; Si et Mi aigu non joués.',
    chord: gVariant('ouvert ré 4 cordes', {
      chord: [[6, 3, 2], [5, 2, 1], [4, 4, 3], [3, 0], [2, 'x'], [1, 'x']],
      position: 0,
      barres: [],
    }),
  },
  {
    id: 'g-18',
    label: 'Forme E partielle (3e case)',
    description: 'Sans barré complet : doigts en case 3-5, La et aigus sourds.',
    chord: gVariant('forme E partielle', {
      position: 3,
      chord: [[6, 1, 1], [5, 3, 3], [4, 3, 4], [3, 2, 2], [2, 'x'], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'g-19',
    label: 'Folk (3e case)',
    description: 'Mi grave et Mi aigu en case 3 ; La sourd ; cordes du milieu à vide.',
    chord: gVariant('folk case 3', {
      position: 3,
      chord: [[6, 1, 1], [5, 'x'], [4, 0], [3, 0], [2, 0], [1, 1, 2]],
      barres: [],
    }),
  },
  {
    id: 'g-20',
    label: 'Variante (3e case)',
    description: 'Mi grave case 3, Sol case 4, cordes ouvertes au centre, aigus contrôlés.',
    chord: gVariant('variante case 3', {
      position: 3,
      chord: [[6, 1, 1], [5, 'x'], [4, 0], [3, 2, 3], [2, 0], [1, 1, 2]],
      barres: [],
    }),
  },
  {
    id: 'g-21',
    label: 'Barré (3e case, La sourd)',
    description: 'Barré case 3 ; La non joué ; doigts sur Sol et Ré.',
    chord: gVariant('barré case 3 la sourd', {
      position: 3,
      chord: [[5, 'x'], [4, 3, 3], [3, 2, 2]],
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-22',
    label: 'Forme C (7e case, Ré sourd)',
    description: 'Barré partiel case 7 ; La case 10 ; Ré et Mi grave sourds.',
    chord: gVariant('forme C ré sourd', {
      position: 7,
      chord: [[6, 'x'], [5, 4, 4], [4, 'x'], [2, 2, 2]],
      barres: [{ fromString: 3, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-23',
    label: 'Forme A (10e case, Ré sourd)',
    description: 'Mi grave et Ré sourds ; barré case 10 sur La et Mi aigu ; Sol et Si à la 12e case.',
    chord: gVariant('forme A ré sourd', {
      position: 10,
      chord: [[6, 'x'], [4, 'x'], [3, 3, 3], [2, 3, 4]],
      barres: [{ fromString: 5, toString: 1, fret: 1 }],
    }),
  },
  {
    id: 'g-24',
    label: 'Power chord (3e case)',
    description: 'Seul le Mi grave en case 3 ; les autres cordes à vide sauf Mi aigu sourd.',
    chord: gVariant('power case 3', {
      position: 3,
      chord: [[6, 1, 1], [5, 0], [4, 0], [3, 0], [2, 0], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'g-25',
    label: 'Variante folk (3e case)',
    description: 'Mi grave case 3, Sol case 4, cordes ouvertes, Mi aigu sourd.',
    chord: gVariant('folk 2 case 3', {
      position: 3,
      chord: [[6, 1, 1], [5, 'x'], [4, 0], [3, 2, 2], [2, 0], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'g-26',
    label: 'Variante fingerstyle (3e case)',
    description: 'Mi grave case 3, Si case 3, Sol case 4, cordes ouvertes au centre.',
    chord: gVariant('fingerstyle case 3', {
      position: 3,
      chord: [[6, 1, 1], [5, 'x'], [4, 0], [3, 2, 3], [2, 1, 2], [1, 'x']],
      barres: [],
    }),
  },
  {
    id: 'g-27',
    label: 'Barré forme E (3e case, La et Mi aigu sourds)',
    description: 'Barré complet case 3 ; La et Mi aigu sourds ; doigts sur Sol (4e) et Ré (5e).',
    chord: gVariant('barré E réduit case 3', {
      position: 3,
      chord: [[5, 'x'], [4, 3, 3], [3, 2, 2], [1, 'x']],
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
    }),
  },
];

const TOTAL = gMajorVariants.length;

import { amMinorVariantGroup } from './amMinorVariants';
import { bDimVariantGroup } from './bDimVariants';
import { bMajorVariantGroup } from './bMajorVariants';
import { bbMajorVariantGroup } from './bbMajorVariants';
import { cadd9VariantGroup } from './cadd9Variants';
import { cMajorVariantGroup } from './cMajorVariants';
import { cmMinorVariantGroup } from './cmMinorVariants';
import { d4VariantGroup } from './d4Variants';
import { dFSharpVariantGroup } from './dFSharpVariants';
import { dMajorVariantGroup } from './dMajorVariants';
import { em7VariantGroup } from './em7Variants';
import { emMinorVariantGroup } from './emMinorVariants';
import { fMajorVariantGroup } from './fMajorVariants';
import { fMaj7VariantGroup } from './fMaj7Variants';
import { fmMinorVariantGroup } from './fmMinorVariants';
import { gmMinorVariantGroup } from './gmMinorVariants';

const chordVariantsFr = [
  {
    id: 'g-major',
    symbol: 'G',
    title: 'Sol majeur (G) — toutes les positions',
    intro:
      `Les ${TOTAL} façons de jouer un Sol majeur, comme dans votre application. `
      + 'Utilisez les flèches pour parcourir chaque diagramme : positions ouvertes, '
      + 'barrés (formes E, D, C, A) et variantes avec cordes sourdes.',
    variants: gMajorVariants.map((v, i) => ({
      ...v,
      label: `${i + 1} / ${TOTAL} — ${v.label}`,
    })),
    showCarousel: true,
  },
  cMajorVariantGroup,
  emMinorVariantGroup,
  dMajorVariantGroup,
  amMinorVariantGroup,
  bMajorVariantGroup,
  dFSharpVariantGroup,
  fMaj7VariantGroup,
  fmMinorVariantGroup,
  bDimVariantGroup,
  bbMajorVariantGroup,
  cmMinorVariantGroup,
  cadd9VariantGroup,
  d4VariantGroup,
  em7VariantGroup,
  fMajorVariantGroup,
  gmMinorVariantGroup,
];

export default chordVariantsFr as ChordVariantGroup[];
