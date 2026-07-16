'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isPending?: boolean
  destructive?: boolean
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  isPending = false,
  destructive = false,
}: ConfirmActionDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border border-black/[0.06] p-5 dark:border-white/[0.08] sm:max-w-md">
        <DialogHeader className="space-y-2 text-start">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            className="h-11 w-full rounded-xl font-medium"
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl font-medium"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel ?? t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
