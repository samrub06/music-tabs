'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChordVariantsCarousel } from './ChordVariantsCarousel';
import type { ChordVariantGroup } from '@/types/chordVariants';

interface ChordVariantsModalProps {
  group: ChordVariantGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChordVariantsModal({
  group,
  open,
  onOpenChange,
}: ChordVariantsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-border bg-card p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{group.title}</DialogTitle>
          <DialogDescription>{group.intro}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center px-4 pb-6 pt-4">
          <ChordVariantsCarousel
            variants={group.variants}
            chordSymbol={group.symbol}
            variant="compact"
            resetKey={open}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
