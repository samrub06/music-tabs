'use client';

import { ChordVariantsCarousel } from './ChordVariantsCarousel';
import type { ChordVariant } from '@/types/chordVariants';

export interface ChordVariantsSectionProps {
  title: string;
  intro: string;
  variants: ChordVariant[];
  showCarousel?: boolean;
}

export function ChordVariantsSection({
  title,
  intro,
  variants,
  showCarousel = false,
}: ChordVariantsSectionProps) {
  return (
    <section className="mb-10 rounded-2xl border border-black/[0.06] bg-card p-4 shadow-sm dark:border-white/[0.08] sm:p-6">
      <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">{intro}</p>
      {showCarousel && (
        <ChordVariantsCarousel variants={variants} variant="full" />
      )}
    </section>
  );
}
