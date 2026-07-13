'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import { getPlaylistCoverOptions } from '@/utils/playlistCover'

interface PlaylistCoverPickerProps {
  value: string | null
  onChange: (slug: string) => void
  disabled?: boolean
}

export function PlaylistCoverPicker({
  value,
  onChange,
  disabled = false,
}: PlaylistCoverPickerProps) {
  const { t } = useLanguage()
  const options = useMemo(() => getPlaylistCoverOptions(), [])

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {t('playlistsPage.chooseCover')}
      </p>
      <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto sm:max-h-52 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option.slug}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.slug)}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
              value === option.slug
                ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                : 'border-transparent hover:border-primary/40',
              disabled && 'pointer-events-none opacity-60'
            )}
            aria-label={option.name}
            aria-pressed={value === option.slug}
          >
            {option.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={option.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/70 to-primary" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-1.5 pt-6">
              <span className="block text-center text-[10px] font-semibold leading-tight text-white line-clamp-2">
                {option.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
