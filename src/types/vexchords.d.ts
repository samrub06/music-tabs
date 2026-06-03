declare module 'vexchords' {
  export interface ChordBoxOptions {
    width?: number;
    height?: number;
    circleRadius?: number;
    numStrings?: number;
    numFrets?: number;
    showTuning?: boolean;
    defaultColor?: string;
    bgColor?: string;
    strokeColor?: string;
    textColor?: string;
    stringColor?: string;
    fretColor?: string;
    labelColor?: string;
    fretWidth?: number;
    stringWidth?: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    labelWeight?: string;
  }

  export type ChordFingeringTuple =
    | [number, number | 'x' | 0]
    | [number, number | 'x' | 0, string | number];

  export interface ChordDrawData {
    chord: ChordFingeringTuple[];
    position?: number;
    positionText?: number;
    barres?: { fromString: number; toString: number; fret: number }[];
    tuning?: string[];
  }

  export class ChordBox {
    constructor(selector: string | HTMLElement, options?: ChordBoxOptions);
    draw(data: ChordDrawData): void;
  }

  export function draw(selector: string | HTMLElement, data: ChordDrawData, options?: ChordBoxOptions): void;
}

